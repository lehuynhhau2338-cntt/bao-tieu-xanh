"use strict";

const STORAGE_PREFIX = "bao-tieu-xanh-demo-v1:";
const DEMO_HOLD_MS = 24 * 60 * 60 * 1000;
const DEFAULT_GROUP_GOAL = 12;
const DEFAULT_GROUP_UNITS = 8;
const MAX_DEMO_PRICE = 1000000000;
const MAX_DEMO_STOCK = 1000000;
let storageParseFailed = false;

const initialProducts = [
  {
    id: "bong-cai-xanh",
    name: "Bông cải xanh",
    category: "Rau củ",
    unit: "500g",
    price: 32000,
    stock: 24,
    region: "Đà Lạt, Lâm Đồng",
    description: "Bông cải xanh tươi giòn thu hoạch sáng sớm từ nông hộ mẫu Đà Lạt, giàu dinh dưỡng cho bữa cơm gia đình.",
    art: "greens",
    image: "assets/images/bong-cai-xanh.jpg",
    badge: "Mới về",
    badgeTone: "green"
  },
  {
    id: "ca-chua-beef",
    name: "Cà chua beef",
    category: "Rau củ",
    unit: "500g",
    price: 28000,
    stock: 30,
    region: "Đà Lạt, Lâm Đồng",
    description: "Cà chua beef quả căng mọng, dày thịt, thích hợp làm salad hoặc chế biến món sốt cà tự nhiên.",
    art: "tomato",
    image: "assets/images/ca-chua-beef.jpg",
    badge: "Bán chạy",
    badgeTone: "amber"
  },
  {
    id: "rau-xa-lach",
    name: "Rau xà lách",
    category: "Rau lá",
    unit: "500g",
    price: 18000,
    stock: 20,
    region: "Mộc Châu, Sơn La",
    description: "Xà lách lá xoăn xanh non trồng theo hướng hữu cơ mô phỏng tại vùng cao nguyên Mộc Châu.",
    art: "greens",
    image: "assets/images/rau-xa-lach.jpg",
    badge: "Hữu cơ (mô phỏng)",
    badgeTone: "leaf"
  },
  {
    id: "bi-do",
    name: "Bí đỏ",
    category: "Rau củ",
    unit: "1kg",
    price: 22000,
    stock: 15,
    region: "Củ Chi, TP.HCM",
    description: "Bí đỏ dẻo ngọt tự nhiên theo mùa vụ mẫu từ nhà vườn ngoại thành Củ Chi, dễ bảo quản và chế biến.",
    art: "squash",
    image: "assets/images/bi-do.jpg",
    badge: "Theo mùa",
    badgeTone: "terracotta"
  },
  {
    id: "khoai-lang-nhat",
    name: "Khoai lang Nhật",
    category: "Rau củ",
    unit: "1kg",
    price: 19000,
    stock: 36,
    region: "Đà Lạt, Lâm Đồng",
    description: "Khoai lang Nhật ruột vàng mật dẻo thơm, mặt hàng tiêu biểu trong chương trình gom đơn mua chung mẫu.",
    art: "squash",
    image: "assets/images/khoai-lang-nhat.jpg",
    badge: "Mua chung",
    badgeTone: "green"
  },
  {
    id: "gio-rau-mua-chung",
    name: "Giỏ rau củ tiết kiệm",
    category: "Tiết kiệm",
    unit: "giỏ 2kg",
    price: 55000,
    stock: 16,
    region: "Củ Chi, TP.HCM",
    description: "Gói nông sản ngoại hình chưa đồng đều nhưng đảm bảo độ tươi, giúp giảm thất thoát sau thu hoạch.",
    art: "herbs",
    image: "assets/images/gio-rau-mua-chung.jpg",
    badge: "Giảm lãng phí",
    badgeTone: "leaf"
  },
  {
    id: "buoi-da-xanh",
    name: "Bưởi da xanh",
    category: "Trái cây",
    unit: "quả",
    price: 36000,
    stock: 14,
    region: "Bến Tre (mẫu)",
    description: "Bưởi da xanh tép hồng mọng nước, dữ liệu mẫu minh họa nhóm trái cây đặc sản vùng miền.",
    art: "citrus",
    image: "",
    badge: "Đặc sản mẫu",
    badgeTone: "amber"
  },
  {
    id: "gao-lut",
    name: "Gạo lứt",
    category: "Nông sản khô",
    unit: "1kg",
    price: 42000,
    stock: 35,
    region: "Sóc Trăng (mẫu)",
    description: "Gạo lứt nguyên cám đóng gói mẫu phục vụ thử nghiệm lọc danh mục nông sản khô và tính giỏ hàng.",
    art: "grain",
    image: "",
    badge: "Định kỳ",
    badgeTone: "terracotta"
  }
];

const defaultImageById = {};
const defaultBadgeById = {};
initialProducts.forEach(function (item) {
  defaultImageById[item.id] = item.image || "";
  defaultBadgeById[item.id] = { badge: item.badge || "Nông sản mẫu", badgeTone: item.badgeTone || "green" };
});

const statusLabels = {
  pending: "Chờ xác nhận demo",
  confirmed: "Đã xác nhận demo",
  preparing: "Đang chuẩn bị demo",
  delivered: "Hoàn tất quy trình demo",
  rejected: "Đã từ chối trong demo",
  cancelled: "Đã hủy trong demo",
  expired: "Đã hết hạn demo"
};

const statusTransitions = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [],
  rejected: [],
  cancelled: [],
  expired: []
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + key);
    if (value === null) return fallback;
    try {
      return JSON.parse(value);
    } catch (_parseError) {
      storageParseFailed = true;
      return fallback;
    }
  } catch (_error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (_error) {
    return false;
  }
}

function safeProductList(value) {
  if (!Array.isArray(value) || !value.length) {
    return initialProducts.map(function (item) { return Object.assign({}, item); });
  }
  const seen = new Set();
  const normalized = value.filter(function (item) {
    return item && typeof item.id === "string" && typeof item.name === "string";
  }).map(function (item, index) {
    const id = String(item.id).trim().slice(0, 64) || "sample-" + index;
    const name = String(item.name).trim().slice(0, 56);
    const rawPrice = Number(item.price);
    const rawStock = Number(item.stock);
    if (!name || seen.has(id)) return null;
    seen.add(id);
    const defaultMeta = defaultBadgeById[id] || { badge: "Nông sản mẫu", badgeTone: "green" };
    const safeImage = typeof item.image === "string" && item.image.trim()
      ? item.image.trim()
      : (defaultImageById[id] || "");
    return {
      id: id,
      name: name,
      category: String(item.category || "Rau củ").trim().slice(0, 32) || "Rau củ",
      unit: String(item.unit || "kg").trim().slice(0, 20) || "kg",
      price: Number.isFinite(rawPrice) ? Math.min(MAX_DEMO_PRICE, Math.max(1, Math.round(rawPrice))) : 1,
      stock: Number.isFinite(rawStock) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(rawStock))) : 0,
      region: String(item.region || "Khu vực mẫu").trim().slice(0, 56) || "Khu vực mẫu",
      description: String(item.description || "Dữ liệu minh họa.").trim().slice(0, 180) || "Dữ liệu minh họa.",
      art: ["greens", "tomato", "citrus", "grain", "herbs", "squash"].indexOf(item.art) >= 0 ? item.art : "greens",
      image: safeImage,
      badge: String(item.badge || defaultMeta.badge).trim().slice(0, 28),
      badgeTone: ["green", "amber", "leaf", "terracotta"].indexOf(item.badgeTone) >= 0 ? item.badgeTone : defaultMeta.badgeTone
    };
  }).filter(Boolean);

  return normalized.length ? normalized : initialProducts.map(function (item) { return Object.assign({}, item); });
}

function safeCartList(value, productList) {
  const itemsById = new Map();
  let changed = !Array.isArray(value);
  const source = Array.isArray(value) ? value : [];
  source.forEach(function (item) {
    if (!item || typeof item.id !== "string") { changed = true; return; }
    const product = productList.find(function (entry) { return entry.id === item.id; });
    const quantity = Number(item.quantity);
    if (!product || !Number.isFinite(quantity) || quantity < 1 || product.stock < 1) { changed = true; return; }
    const normalizedQuantity = Math.min(product.stock, MAX_DEMO_STOCK, Math.floor(quantity));
    if (normalizedQuantity < 1) { changed = true; return; }
    if (!Number.isSafeInteger(quantity) || quantity !== normalizedQuantity || itemsById.has(item.id)) changed = true;
    const previous = itemsById.get(item.id) || 0;
    itemsById.set(item.id, Math.min(product.stock, previous + normalizedQuantity));
  });
  const items = Array.from(itemsById, function (entry) { return { id: entry[0], quantity: entry[1] }; });
  if (Array.isArray(value) && value.length !== items.length) changed = true;
  if (Array.isArray(value) && !changed && value.some(function (item, index) {
    return item.id !== items[index].id || item.quantity !== items[index].quantity;
  })) changed = true;
  return { items: items, changed: changed };
}

function statusEvent(status, note, at) {
  return { status: status, label: statusLabels[status] || "Cập nhật demo", note: note, at: at || Date.now() };
}

function safeOrderList(value) {
  if (!Array.isArray(value)) return { items: [], changed: true };
  const seenCodes = new Set();
  let changed = false;
  const items = value.map(function (raw) {
    if (!raw || typeof raw !== "object") { changed = true; return null; }
    const code = String(raw.code || "").trim().toUpperCase().slice(0, 32);
    const status = Object.prototype.hasOwnProperty.call(statusLabels, raw.status) ? raw.status : "pending";
    const rawCreatedAt = Number(raw.createdAt);
    const createdAt = Number.isFinite(rawCreatedAt) && rawCreatedAt > 0 && rawCreatedAt <= 8640000000000000 ? rawCreatedAt : Date.now();
    const rawExpiresAt = Number(raw.expiresAt);
    const expiresAt = Number.isFinite(rawExpiresAt) && rawExpiresAt > 0 && rawExpiresAt <= 8640000000000000 ? rawExpiresAt : createdAt + DEMO_HOLD_MS;
    const linesById = new Map();
    (Array.isArray(raw.lines) ? raw.lines : []).forEach(function (line) {
      if (!line || typeof line.productId !== "string" || linesById.has(line.productId)) { changed = true; return; }
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice);
      if (!Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) { changed = true; return; }
      linesById.set(line.productId, {
        productId: line.productId.slice(0, 64),
        name: String(line.name || "Sản phẩm mẫu").slice(0, 56),
        unit: String(line.unit || "đơn vị mẫu").slice(0, 20),
        unitPrice: Math.min(MAX_DEMO_PRICE, Math.floor(unitPrice)),
        quantity: Math.min(MAX_DEMO_STOCK, Math.floor(quantity))
      });
    });
    const lines = Array.from(linesById.values()).filter(function (line) { return line.quantity > 0; });
    if (!/^BTX-[A-Z0-9-]{4,27}$/.test(code) || seenCodes.has(code) || !lines.length) { changed = true; return null; }
    seenCodes.add(code);
    const rawTotal = lines.reduce(function (sum, line) { return sum + line.unitPrice * line.quantity; }, 0);
    const total = Number.isSafeInteger(rawTotal) ? rawTotal : Number.MAX_SAFE_INTEGER;
    const history = (Array.isArray(raw.history) ? raw.history.slice(-100) : []).filter(function (event) {
      return event && typeof event === "object" && Number.isFinite(Number(event.at)) && Number(event.at) > 0 && Number(event.at) <= 8640000000000000;
    }).map(function (event) {
      return {
        status: Object.prototype.hasOwnProperty.call(statusLabels, event.status) ? event.status : status,
        label: String(event.label || statusLabels[event.status] || "Cập nhật demo").slice(0, 80),
        note: String(event.note || "").slice(0, 180),
        at: Number(event.at)
      };
    });
    if (!history.length) history.push(statusEvent(status, "Lịch sử đơn demo đã được kiểm tra lại.", createdAt));
    const inventoryReleased = Boolean(raw.inventoryReleased) || ["rejected", "cancelled", "expired"].indexOf(status) >= 0;
    if (raw.code !== code || raw.status !== status || raw.inventoryReleased !== inventoryReleased || raw.total !== total || rawCreatedAt !== createdAt || rawExpiresAt !== expiresAt || !Array.isArray(raw.lines) || !Array.isArray(raw.history) || !Number.isSafeInteger(rawTotal)) changed = true;
    return {
      code: code,
      createdAt: createdAt,
      expiresAt: expiresAt,
      status: status,
      inventoryReleased: inventoryReleased,
      lines: lines,
      total: total,
      schedule: String(raw.schedule || "Giao tiêu chuẩn trong ngày (mô phỏng)").slice(0, 80),
      note: String(raw.note || "").slice(0, 100),
      history: history
    };
  }).filter(Boolean);
  if (items.length !== value.length) changed = true;
  return { items: items, changed: changed };
}

const storedProducts = readStorage("products", null);
let products = safeProductList(storedProducts);
const savedCart = safeCartList(readStorage("cart", []), products);
let cart = savedCart.items;
const savedOrders = safeOrderList(readStorage("orders", []));
let orders = savedOrders.items;

let storageRepairNotice = storageParseFailed || savedCart.changed || savedOrders.changed;
const rawSavedGroupUnits = readStorage("group-units", null);
const savedGroupUnits = rawSavedGroupUnits === null ? DEFAULT_GROUP_UNITS : Number(rawSavedGroupUnits);
let demoGroupUnits = Number.isFinite(savedGroupUnits) ? Math.min(500000, Math.max(0, Math.floor(savedGroupUnits))) : DEFAULT_GROUP_UNITS;

const savedGroupGoal = Number(readStorage("group-goal", DEFAULT_GROUP_GOAL));
let demoGroupGoal = Number.isFinite(savedGroupGoal) ? Math.max(1, Math.min(500, Math.floor(savedGroupGoal))) : DEFAULT_GROUP_GOAL;

const savedGroupTitle = readStorage("group-title", "Khoai lang Nhật");
let demoGroupTitle = (typeof savedGroupTitle === "string" ? savedGroupTitle.trim() : "").slice(0, 48) || "Khoai lang Nhật";

const savedFavorites = readStorage("favorites", []);
let favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites.filter(function (id) { return typeof id === "string"; }) : []);

let activeCategory = "Tất cả";
let isCatalogExpanded = false;
let toastTimer = 0;

const productGrid = document.getElementById("product-grid");
const categoryFilters = document.getElementById("category-filters");
const regionFilter = document.getElementById("region-filter");
const searchInput = document.getElementById("product-search");
const sortSelect = document.getElementById("sort-select");
const priceFilter = document.getElementById("price-filter");
const cartLines = document.getElementById("cart-lines");
const cartTotal = document.getElementById("cart-total");
const checkoutResult = document.getElementById("checkout-result");
const placeOrderButton = document.getElementById("place-order");
const toast = document.getElementById("toast");
const toggleCatalogButton = document.getElementById("toggle-catalog-view");
const toggleCatalogLabel = document.getElementById("toggle-catalog-label");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[character];
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0)) + " ₫";
}

function formatTime(value) {
  const time = Number(value);
  if (!Number.isFinite(time) || time <= 0 || time > 8640000000000000) return "Thời gian không rõ";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(time));
}

function normalizeSearch(value) {
  return String(value).toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").trim();
}

function persistAll() {
  const ok = [
    writeStorage("products", products),
    writeStorage("cart", cart),
    writeStorage("orders", orders),
    writeStorage("group-units", demoGroupUnits),
    writeStorage("group-goal", demoGroupGoal),
    writeStorage("group-title", demoGroupTitle),
    writeStorage("favorites", Array.from(favorites))
  ].every(Boolean);
  if (!ok) showToast("Trình duyệt không lưu được dữ liệu. Thao tác chỉ còn trong phiên này.");
  return ok;
}

function prefersReducedMotion() {
  const mode = document.documentElement.getAttribute("data-motion");
  if (mode === "off") return true;
  if (mode === "force-on") return false;
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function pulseElement(element, keyframes, duration) {
  if (!element || typeof element.animate !== "function" || prefersReducedMotion()) return;
  try {
    element.animate(keyframes, {
      duration: duration || 260,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    });
  } catch (_err) {
    /* ignore if WAAPI unsupported */
  }
}

function flyToCart(sourceElement) {
  if (!sourceElement || prefersReducedMotion()) return;
  const cartButton = document.getElementById("cart-open");
  if (!cartButton) return;
  const startRect = sourceElement.getBoundingClientRect();
  const endRect = cartButton.getBoundingClientRect();
  if (!startRect.width && !startRect.height) return;

  const startX = startRect.left + startRect.width / 2 - 17;
  const startY = startRect.top + startRect.height / 2 - 17;
  const endX = endRect.left + endRect.width / 2 - 17;
  const endY = endRect.top + endRect.height / 2 - 17;

  const orb = document.createElement("div");
  orb.className = "fly-to-cart-orb";
  orb.setAttribute("aria-hidden", "true");
  orb.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3C6 3 3 6.5 3 11c0 3.3 2.7 6 6 6 4.5 0 8-3 8-7.5C17 5.5 14 3 10 3Z"/><path d="M5 15c3-3 6-5 11-7"/></svg>';
  orb.style.transform = "translate3d(" + startX.toFixed(1) + "px, " + startY.toFixed(1) + "px, 0) scale(0.9)";
  document.body.appendChild(orb);

  const ctrlX = (startX + endX) / 2 + (startX > endX ? -60 : 60);
  const ctrlY = Math.min(startY, endY) - 110;
  const steps = 18;
  const keyframes = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const inv = 1 - t;
    const x = inv * inv * startX + 2 * inv * t * ctrlX + t * t * endX;
    const y = inv * inv * startY + 2 * inv * t * ctrlY + t * t * endY;
    const scale = t < 0.25 ? 0.9 + t * 1.2 : 1.2 - (t - 0.25) * 0.88;
    const opacity = t > 0.85 ? Math.max(0.2, (1 - t) * 6.5) : 1;
    keyframes.push({
      transform: "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0) scale(" + scale.toFixed(2) + ") rotate(" + Math.round(t * 220) + "deg)",
      opacity: opacity
    });
  }

  if (typeof orb.animate === "function") {
    const anim = orb.animate(keyframes, {
      duration: 620,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards"
    });
    anim.onfinish = function () {
      orb.remove();
      pulseElement(cartButton, [
        { transform: "scale(1)" },
        { transform: "scale(1.12)" },
        { transform: "scale(0.96)" },
        { transform: "scale(1)" }
      ], 320);
    };
  } else {
    window.setTimeout(function () { orb.remove(); }, 400);
  }
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 3200);
}

function productGraphic(type) {
  const art = {
    greens: '<path d="M118 140c-47-30-54-73-18-124 46 34 55 75 18 124Zm20 4c-2-64 28-98 90-101 2 59-28 93-90 101Zm-42-3c-35-48-27-90 25-124 30 48 22 90-25 124Z" fill="#347344"/><path d="M129 161V50m8 92 44-56m-56 49L91 78" fill="none" stroke="#214f34" stroke-width="5" stroke-linecap="round"/><path d="M87 148c20 13 51 19 80 11" fill="none" stroke="#77a452" stroke-width="9" stroke-linecap="round"/>',
    tomato: '<circle cx="124" cy="112" r="49" fill="#d2523b"/><circle cx="179" cy="130" r="39" fill="#e16b43"/><circle cx="80" cy="143" r="32" fill="#bc4537"/><path d="m124 63 10 17 20-6-13 18 7 19-22-10-17 13 4-22-17-14 21-1Zm55 28 8 14 17-4-11 15 6 16-18-8-14 11 3-18-13-11 17-1Z" fill="#3f7641"/><path d="M112 114c12-18 25-20 40-7" fill="none" stroke="#ef9b73" stroke-width="6" stroke-linecap="round"/>',
    citrus: '<circle cx="102" cy="114" r="47" fill="#4f9345"/><circle cx="160" cy="125" r="53" fill="#68ab57"/><circle cx="207" cy="113" r="39" fill="#df8879"/><path d="M102 67c-7-19 0-30 23-35 3 22-4 34-23 35Zm58 5c-2-21 8-31 31-31 0 22-10 32-31 31Z" fill="#2e6b34"/><path d="M102 80c-18 19-26 42-24 68m82-77c-20 22-29 47-26 75" fill="none" stroke="#b9de9c" stroke-width="4"/>',
    grain: '<path d="M120 169V55m0 59L86 83m34 6 34-35m-34 87-40-26m40-17 40-37m-40 93-32-7m32-33 33-30" fill="none" stroke="#9c773b" stroke-width="7" stroke-linecap="round"/><path d="M84 86c-7-14-4-24 10-32 11 12 9 22-10 32Zm41-3c1-16 10-23 26-22-1 15-10 23-26 22Zm-38 32c-12-11-12-21 0-32 14 9 14 20 0 32Zm38-30c4-16 14-21 30-16-5 15-15 21-30 16Zm-36 60c-14-8-17-18-8-32 16 6 19 16 8 32Zm39-30c8-13 19-15 33-6-9 13-19 15-33 6Z" fill="#d3a64c"/><path d="M177 169V78m0 49-28-25m28-5 31-30m-31 82 36-26" fill="none" stroke="#9c773b" stroke-width="6" stroke-linecap="round"/>',
    herbs: '<path d="M119 163c-45-36-46-79-3-128 40 40 41 83 3 128Zm35-3c-13-59 9-96 67-111 13 57-10 94-67 111Zm-68-9c-27-56-12-96 47-118 20 55 5 94-47 118Z" fill="#5f8e4a"/><path d="M130 164V48m12 103 39-65m-62 66L95 79" fill="none" stroke="#315d3a" stroke-width="5" stroke-linecap="round"/><path d="M97 153c23 10 49 13 78 6" fill="none" stroke="#94b56b" stroke-width="8" stroke-linecap="round"/>',
    squash: '<path d="M79 111c0-36 23-58 59-58 16 0 27 7 34 18 8-11 20-18 36-18 37 0 60 22 60 58 0 43-39 65-94 65s-95-22-95-65Z" fill="#d9903d"/><path d="M171 72c1-24 14-38 39-43 6 21-4 36-39 43Z" fill="#4a7c43"/><path d="M132 67c-19 28-24 59-15 95m65-99c-10 31-10 63 0 96m42-91c-19 25-24 55-16 87" fill="none" stroke="#efb66d" stroke-width="5" stroke-linecap="round"/>'
  };
  const content = art[type] || art.greens;
  return '<svg viewBox="0 0 300 200" aria-hidden="true" focusable="false"><rect width="300" height="200" fill="#e8f1e1"/><path d="M45 162h210" fill="none" stroke="#789264" stroke-width="3" stroke-linecap="round"/>' + content + "</svg>";
}

function renderProductMedia(item) {
  if (item.image) {
    return '<img src="' + escapeHtml(item.image) + '" alt="Hình minh họa ' + escapeHtml(item.name) + '" width="360" height="270">';
  }
  return productGraphic(item.art);
}

function renderCategories() {
  const focusedCategory = document.activeElement && document.activeElement.closest
    ? document.activeElement.closest("#category-filters [data-category]")
    : null;
  const previousFocusedCategory = focusedCategory ? focusedCategory.getAttribute("data-category") : "";
  const categories = ["Tất cả"].concat(Array.from(new Set(products.map(function (item) { return item.category; }))).sort(function (a, b) { return a.localeCompare(b, "vi"); }));
  if (categories.indexOf(activeCategory) < 0) activeCategory = "Tất cả";
  categoryFilters.innerHTML = categories.map(function (category) {
    return '<button type="button" data-category="' + escapeHtml(category) + '" aria-pressed="' + String(activeCategory === category) + '">' + escapeHtml(category) + "</button>";
  }).join("");
  if (previousFocusedCategory) {
    const targetBtn = Array.from(categoryFilters.querySelectorAll("[data-category]")).find(function (button) {
      return button.getAttribute("data-category") === previousFocusedCategory;
    });
    if (targetBtn) targetBtn.focus();
  }

  const previousRegion = regionFilter.value;
  const regions = Array.from(new Set(products.map(function (item) { return item.region; }))).sort(function (a, b) { return a.localeCompare(b, "vi"); });
  regionFilter.innerHTML = '<option value="">Tất cả vùng</option>' + regions.map(function (region) {
    return '<option value="' + escapeHtml(region) + '">' + escapeHtml(region) + "</option>";
  }).join("");
  if (regions.indexOf(previousRegion) >= 0) regionFilter.value = previousRegion;
}

function hasActiveFilter() {
  return Boolean(
    normalizeSearch(searchInput.value) ||
    activeCategory !== "Tất cả" ||
    regionFilter.value !== "" ||
    priceFilter.value !== "all" ||
    sortSelect.value !== "featured"
  );
}

function renderProducts() {
  renderCategories();
  const query = normalizeSearch(searchInput.value);
  const matching = products.filter(function (item) {
    const matchesText = normalizeSearch(item.name + " " + item.category + " " + item.region + " " + item.description).indexOf(query) >= 0;
    const matchesCategory = activeCategory === "Tất cả" || item.category === activeCategory;
    const matchesRegion = !regionFilter.value || item.region === regionFilter.value;
    const matchesPrice = priceFilter.value === "all" ||
      (priceFilter.value === "low" && item.price <= 30000) ||
      (priceFilter.value === "middle" && item.price > 30000 && item.price <= 50000) ||
      (priceFilter.value === "high" && item.price > 50000);
    return matchesText && matchesCategory && matchesRegion && matchesPrice;
  });

  if (sortSelect.value === "price-asc") matching.sort(function (a, b) { return a.price - b.price; });
  if (sortSelect.value === "price-desc") matching.sort(function (a, b) { return b.price - a.price; });
  if (sortSelect.value === "name") matching.sort(function (a, b) { return a.name.localeCompare(b.name, "vi"); });

  const showAll = isCatalogExpanded || hasActiveFilter() || matching.length <= 4;
  const visible = showAll ? matching : matching.slice(0, 4);

  if (toggleCatalogLabel && toggleCatalogButton) {
    if (hasActiveFilter()) {
      toggleCatalogLabel.textContent = "Đặt lại bộ lọc (" + matching.length + ")";
    } else if (matching.length > 4) {
      toggleCatalogLabel.textContent = isCatalogExpanded
        ? "Thu gọn nổi bật (4)"
        : "Xem tất cả (" + matching.length + " nông sản)";
    } else {
      toggleCatalogLabel.textContent = "Xem tất cả";
    }
  }

  document.getElementById("results-count").textContent = showAll
    ? matching.length + " sản phẩm mẫu"
    : "Hiển thị 4 nổi bật / " + matching.length + " sản phẩm mẫu";

  if (!visible.length) {
    const emptyTitle = products.length ? "Chưa tìm thấy sản phẩm phù hợp" : "Danh mục mẫu đang trống";
    const emptyCopy = products.length
      ? "Thử từ khóa hoặc bộ lọc khác để xem các mặt hàng minh họa."
      : "Có thể thêm lại sản phẩm trong bảng quản trị demo.";
    productGrid.innerHTML = '<div class="product-empty"><strong>' + emptyTitle + "</strong><p>" + emptyCopy + "</p>" +
      (products.length
        ? '<button class="button button-light" type="button" data-reset-filters>Đặt lại bộ lọc</button>'
        : '<button class="button button-light" type="button" data-open-dialog="admin-dialog">Mở quản trị demo</button>') +
      "</div>";
    return;
  }

  productGrid.innerHTML = visible.map(function (item, index) {
    const stockText = item.stock > 0 ? "Tồn mẫu: " + item.stock : "Tạm hết mẫu";
    const isFav = favorites.has(item.id);
    const badgeToneClass = item.badgeTone ? " tone-" + escapeHtml(item.badgeTone) : "";
    const badgeHtml = item.badge
      ? '<span class="product-badge' + badgeToneClass + '">' + escapeHtml(item.badge) + "</span>"
      : "";

    return '<article class="product-card" data-reveal style="--stagger-i: ' + (index % 4) + '">' +
      '<div class="product-art">' +
      badgeHtml +
      '<button class="favorite-button" type="button" data-favorite-product="' + escapeHtml(item.id) + '" aria-pressed="' + String(isFav) + '" aria-label="Yêu thích ' + escapeHtml(item.name) + '">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="' + (isFav ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      "</button>" +
      renderProductMedia(item) +
      "</div>" +
      '<div class="product-info">' +
      "<h3>" + escapeHtml(item.name) + "</h3>" +
      '<p class="product-location">' +
      '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"/><circle cx="10" cy="8" r="2.2"/></svg>' +
      "<span>" + escapeHtml(item.region) + "</span>" +
      "</p>" +
      '<p class="product-description">' + escapeHtml(item.description) + "</p>" +
      '<div class="product-price-row">' +
      '<span class="product-price-wrap"><span class="product-price">' + formatCurrency(item.price) + '</span><span class="product-unit">/ ' + escapeHtml(item.unit) + "</span></span>" +
      '<span class="product-stock">' + escapeHtml(stockText) + "</span>" +
      "</div>" +
      '<div class="product-actions">' +
      '<button class="button button-light" type="button" data-view-product="' + escapeHtml(item.id) + '">Xem chi tiết</button>' +
      '<button class="button button-dark" type="button" data-add-product="' + escapeHtml(item.id) + '"' + (item.stock <= 0 ? " disabled" : "") + ">" +
      '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="17" r="1.3"/><circle cx="15" cy="17" r="1.3"/><path d="M2.5 3.5h2l2 9.2a1.5 1.5 0 0 0 1.5 1.2h7.2a1.5 1.5 0 0 0 1.5-1.2L18 6H5"/></svg>' +
      "<span>Thêm giỏ</span></button>" +
      "</div>" +
      "</div></article>";
  }).join("");
  observeReveals(productGrid);
}

function renderMarketTable() {
  const rows = products;
  const body = document.getElementById("market-table-body");
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="5">Chưa có dữ liệu giá minh họa.</td></tr>';
    return;
  }
  body.innerHTML = rows.map(function (item) {
    return "<tr>" +
      "<td><strong>" + escapeHtml(item.name) + "</strong></td>" +
      "<td>" + escapeHtml(item.region) + "</td>" +
      "<td>" + escapeHtml(item.unit) + "</td>" +
      "<td>" + item.stock + "</td>" +
      "<td>" + formatCurrency(item.price) + "</td>" +
      "</tr>";
  }).join("");
}

function getProduct(id) {
  return products.find(function (item) { return item.id === id; });
}

function toggleFavorite(id) {
  const product = getProduct(id);
  if (!product) return;
  if (favorites.has(id)) {
    favorites.delete(id);
    showToast("Đã bỏ " + product.name + " khỏi mục yêu thích demo.");
  } else {
    favorites.add(id);
    showToast("Đã lưu " + product.name + " vào mục yêu thích demo.");
  }
  persistAll();
  renderProducts();
  const updatedFavBtn = productGrid.querySelector('[data-favorite-product="' + CSS.escape(id) + '"]');
  pulseElement(updatedFavBtn, [
    { transform: "scale(0.86)" },
    { transform: "scale(1.18)" },
    { transform: "scale(1)" }
  ], 220);
}

function addToCart(id, sourceBtn) {
  const product = getProduct(id);
  if (!product || product.stock < 1) {
    showToast("Sản phẩm mẫu hiện không còn tồn.");
    return;
  }
  const line = cart.find(function (item) { return item.id === id; });
  if (line && line.quantity >= product.stock) {
    showToast("Số lượng đã đạt mức tồn mẫu.");
    return;
  }
  if (line) line.quantity += 1;
  else cart.push({ id: id, quantity: 1 });
  persistAll();
  renderCart();
  flyToCart(sourceBtn);
  pulseElement(document.getElementById("cart-count"), [
    { transform: "scale(1)" },
    { transform: "scale(1.32)" },
    { transform: "scale(1)" }
  ], 280);
  pulseElement(document.getElementById("cart-open"), [
    { transform: "scale(1)" },
    { transform: "scale(1.06)" },
    { transform: "scale(1)" }
  ], 240);
  if (sourceBtn && sourceBtn.closest("#product-grid") && !sourceBtn.disabled) {
    const labelSpan = sourceBtn.querySelector("span");
    sourceBtn.classList.add("is-added");
    if (labelSpan) labelSpan.textContent = "Đã thêm ✓";
    pulseElement(sourceBtn, [
      { transform: "scale(0.95)" },
      { transform: "scale(1.04)" },
      { transform: "scale(1)" }
    ], 240);
    window.clearTimeout(sourceBtn._addedTimer);
    sourceBtn._addedTimer = window.setTimeout(function () {
      sourceBtn.classList.remove("is-added");
      if (labelSpan) labelSpan.textContent = "Thêm giỏ";
    }, 800);
  }
  showToast(product.name + " đã được thêm vào giỏ demo.");
}

function removeCartLine(id) {
  cart = cart.filter(function (item) { return item.id !== id; });
  persistAll();
  renderCart();
}

function changeCartQuantity(id, delta) {
  if (!Number.isSafeInteger(delta) || Math.abs(delta) !== 1) return;
  const line = cart.find(function (item) { return item.id === id; });
  const product = getProduct(id);
  if (!line || !product) return;
  const nextQuantity = line.quantity + delta;
  if (nextQuantity < 1) {
    removeCartLine(id);
    return;
  }
  if (nextQuantity > product.stock) {
    showToast("Số lượng vượt tồn mẫu hiện có.");
    return;
  }
  line.quantity = nextQuantity;
  persistAll();
  renderCart();
}

function renderCart() {
  const normalized = safeCartList(cart, products);
  if (normalized.changed) {
    cart = normalized.items;
    persistAll();
    showToast("Giỏ hàng đã được điều chỉnh theo tồn mẫu hiện có.");
  }
  const count = cart.reduce(function (sum, line) { return sum + Math.floor(Number(line.quantity) || 0); }, 0);
  const countNode = document.getElementById("cart-count");
  countNode.textContent = String(count);
  countNode.setAttribute("aria-label", count + " sản phẩm");

  if (!cart.length) {
    cartLines.innerHTML = '<div class="cart-empty"><p>Giỏ hàng demo đang trống.</p><a class="button button-light" href="#san-pham" data-close-dialog="cart-dialog">Tiếp tục xem sản phẩm</a></div>';
    cartTotal.textContent = formatCurrency(0);
    placeOrderButton.disabled = true;
    return;
  }

  cartLines.innerHTML = '<div class="cart-lines">' + cart.map(function (line) {
    const product = getProduct(line.id);
    if (!product) return "";
    const total = product.price * line.quantity;
    return '<article class="cart-line"><div><h3>' + escapeHtml(product.name) + "</h3><p>" + formatCurrency(product.price) + " / " + escapeHtml(product.unit) + " · Thành tiền " + formatCurrency(total) + '</p><button class="remove-button" type="button" data-cart-remove="' + escapeHtml(product.id) + '">Xóa mặt hàng</button></div>' +
      '<div class="cart-line-actions" aria-label="Số lượng ' + escapeHtml(product.name) + '"><button class="quantity-button" type="button" data-cart-change="-1" data-id="' + escapeHtml(product.id) + '" aria-label="Giảm số lượng">−</button><strong>' + line.quantity + '</strong><button class="quantity-button" type="button" data-cart-change="1" data-id="' + escapeHtml(product.id) + '" aria-label="Tăng số lượng">+</button></div></article>';
  }).join("") + "</div>";

  const total = cart.reduce(function (sum, line) {
    const product = getProduct(line.id);
    return sum + (product ? product.price * line.quantity : 0);
  }, 0);
  const totalIsSafe = Number.isSafeInteger(total);
  cartTotal.textContent = totalIsSafe ? formatCurrency(total) : "Vượt giới hạn tính toán";
  placeOrderButton.disabled = !totalIsSafe;
  if (!totalIsSafe) checkoutResult.textContent = "Giảm số lượng mặt hàng để tiếp tục tạo đơn demo.";
  else if (checkoutResult.textContent === "Giảm số lượng mặt hàng để tiếp tục tạo đơn demo.") checkoutResult.textContent = "";
}

function releaseReservedStock(order) {
  if (!order || order.inventoryReleased || !Array.isArray(order.lines)) return false;
  order.lines.forEach(function (line) {
    const product = getProduct(line.productId);
    const quantity = Number(line.quantity);
    if (product && Number.isSafeInteger(quantity) && quantity > 0) {
      product.stock = Math.min(Number.MAX_SAFE_INTEGER, product.stock + quantity);
    }
  });
  order.inventoryReleased = true;
  return true;
}

function expirePendingOrders() {
  const now = Date.now();
  let changed = false;
  orders.forEach(function (order) {
    if (order.status === "pending" && Number(order.expiresAt) > 0 && now >= Number(order.expiresAt)) {
      releaseReservedStock(order);
      order.status = "expired";
      order.history = Array.isArray(order.history) ? order.history : [];
      order.history.push(statusEvent("expired", "Đơn chờ quá 24 giờ trong mô phỏng; tồn mẫu được trả một lần.", now));
      changed = true;
    }
  });
  if (changed) {
    persistAll();
    renderProducts();
    renderMarketTable();
    renderAdmin();
    renderRecentOrdersBar();
  }
}

function createOrderCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bytes = new Uint8Array(5);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    }
    const suffix = Array.from(bytes).map(function (byte) { return ("0" + byte.toString(16)).slice(-2); }).join("").toUpperCase();
    const code = "BTX-" + suffix;
    if (!orders.some(function (order) { return order.code === code; })) return code;
  }
  return "BTX-" + Date.now().toString(36).toUpperCase();
}

function placeDemoOrder() {
  expirePendingOrders();
  const normalized = safeCartList(cart, products);
  if (normalized.changed) {
    cart = normalized.items;
    persistAll();
  }
  if (!cart.length) {
    renderCart();
    showToast("Hãy thêm sản phẩm mẫu trước khi tạo đơn.");
    return;
  }
  let orderTotal = 0;
  for (const line of cart) {
    const product = getProduct(line.id);
    if (!product || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > product.stock) {
      renderCart();
      checkoutResult.textContent = "Tồn mẫu đã thay đổi. Hãy kiểm tra lại giỏ trước khi thử.";
      return;
    }
    orderTotal += product.price * line.quantity;
    if (!Number.isSafeInteger(orderTotal)) {
      checkoutResult.textContent = "Tổng đơn demo vượt giới hạn tính toán an toàn. Hãy giảm số lượng.";
      return;
    }
  }

  const scheduleSelect = document.getElementById("checkout-schedule");
  const noteInput = document.getElementById("checkout-note");
  const schedule = scheduleSelect ? String(scheduleSelect.value || "Giao tiêu chuẩn trong ngày (mô phỏng)").slice(0, 80) : "Giao tiêu chuẩn trong ngày (mô phỏng)";
  const customNote = noteInput ? String(noteInput.value || "").trim().slice(0, 100) : "";

  const now = Date.now();
  const orderLines = cart.map(function (line) {
    const product = getProduct(line.id);
    product.stock -= line.quantity;
    return {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      unitPrice: product.price,
      quantity: line.quantity
    };
  });
  const historyNote = customNote
    ? "Đơn demo được tạo (" + schedule + "). Ghi chú: " + customNote
    : "Đơn demo được tạo (" + schedule + "). Tồn mẫu được giữ tối đa 24 giờ.";
  const order = {
    code: createOrderCode(),
    createdAt: now,
    expiresAt: now + DEMO_HOLD_MS,
    status: "pending",
    inventoryReleased: false,
    lines: orderLines,
    total: orderTotal,
    schedule: schedule,
    note: customNote,
    history: [statusEvent("pending", historyNote, now)]
  };
  orders.unshift(order);
  cart = [];
  if (noteInput) noteInput.value = "";
  checkoutResult.innerHTML = "<p>Đã tạo đơn mô phỏng (chỉ lưu trong trình duyệt này, không phát sinh giao dịch thật).</p><span class=\"checkout-code\">" + escapeHtml(order.code) + '</span><button class="button button-light" type="button" data-track-code="' + escapeHtml(order.code) + '">Theo dõi đơn này</button>';
  persistAll();
  renderCart();
  renderProducts();
  renderMarketTable();
  renderAdmin();
  renderRecentOrdersBar();
  showToast("Đã tạo đơn demo " + order.code + ".");
}

function transitionOrder(id, nextStatus) {
  const beforeTransition = orders.find(function (item) { return item.code === id; });
  const elapsedReservation = beforeTransition && beforeTransition.status === "pending" && Number(beforeTransition.expiresAt) > 0 && Date.now() >= Number(beforeTransition.expiresAt);
  expirePendingOrders();
  if (elapsedReservation) {
    showToast("Đơn demo đã hết hạn và tồn mẫu đã được trả lại.");
    renderAdmin();
    return;
  }
  const order = orders.find(function (item) { return item.code === id; });
  if (!order || !statusTransitions[order.status] || statusTransitions[order.status].indexOf(nextStatus) < 0) {
    showToast("Trạng thái này không áp dụng cho đơn hiện tại.");
    renderAdmin();
    return;
  }
  order.status = nextStatus;
  const notes = {
    confirmed: "Nhân viên demo xác nhận đơn trong bảng điều phối.",
    preparing: "Đơn chuyển sang bước chuẩn bị mô phỏng.",
    delivered: "Đã hoàn tất quy trình trong trình diễn; không có giao hàng thật.",
    rejected: "Đơn bị từ chối trong mô phỏng; tồn mẫu được trả một lần.",
    cancelled: "Đơn được hủy trong mô phỏng; tồn mẫu được trả một lần."
  };
  if (nextStatus === "rejected" || nextStatus === "cancelled") releaseReservedStock(order);
  order.history = Array.isArray(order.history) ? order.history : [];
  order.history.push(statusEvent(nextStatus, notes[nextStatus] || "Trạng thái demo được cập nhật."));
  persistAll();
  renderProducts();
  renderMarketTable();
  renderAdmin();
  renderRecentOrdersBar();
  const currentTrackedCode = document.getElementById("track-code") ? document.getElementById("track-code").value.trim() : "";
  if (currentTrackedCode && currentTrackedCode.toUpperCase() === order.code) {
    renderTracking(order);
  }
  showToast("Đã cập nhật trạng thái đơn demo " + order.code + ".");
}

function findOrder(code) {
  return orders.find(function (order) { return String(order.code).toUpperCase() === String(code).trim().toUpperCase(); });
}

function renderRecentOrdersBar() {
  const bar = document.getElementById("recent-orders-bar");
  if (!bar) return;
  if (!orders.length) {
    bar.innerHTML = "";
    return;
  }
  bar.innerHTML = '<span class="admin-subline">Đơn gần đây trên thiết bị này:</span>' +
    orders.slice(0, 5).map(function (order) {
      return '<button class="recent-order-chip" type="button" data-quick-track="' + escapeHtml(order.code) + '">' + escapeHtml(order.code) + " (" + escapeHtml(statusLabels[order.status] || order.status) + ")</button>";
    }).join("");
}

function renderTracking(order) {
  const target = document.getElementById("track-result");
  if (!order) {
    target.innerHTML = '<p class="product-empty">Không tìm thấy mã đơn trong dữ liệu của trình duyệt này.</p>';
    return;
  }
  const history = Array.isArray(order.history) ? order.history : [];
  const lines = Array.isArray(order.lines) ? order.lines : [];
  const canCancel = order.status === "pending" || order.status === "confirmed";
  target.innerHTML = '<article class="tracking-card"><h3>' + escapeHtml(order.code) + "</h3>" +
    "<p><strong>" + escapeHtml(statusLabels[order.status] || "Trạng thái demo") + "</strong> · Tạo lúc " + escapeHtml(formatTime(order.createdAt)) + "</p>" +
    "<p>" + lines.map(function (line) { return escapeHtml(line.name) + " × " + Math.max(0, Number(line.quantity) || 0); }).join(", ") + " · Tổng minh họa <strong>" + formatCurrency(order.total) + "</strong></p>" +
    (order.schedule ? '<p class="admin-subline">Hình thức mẫu: ' + escapeHtml(order.schedule) + "</p>" : "") +
    '<ol class="tracking-lines">' + history.map(function (event) {
      return "<li><strong>" + escapeHtml(event.label || statusLabels[event.status] || "Cập nhật demo") + "</strong><br><span>" + escapeHtml(formatTime(event.at)) + " · " + escapeHtml(event.note || "") + "</span></li>";
    }).join("") + "</ol>" +
    (canCancel ? '<div style="margin-top:0.85rem"><button class="button button-light button-small" type="button" data-cancel-order="' + escapeHtml(order.code) + '">Hủy đơn demo này</button></div>' : "") +
    "</article>";
}

function renderGroupProgress(animateUpdate) {
  const amount = Math.min(demoGroupGoal, Math.max(0, demoGroupUnits));
  const progress = document.getElementById("group-progress");
  const meterFill = document.getElementById("group-meter-fill");
  const pctBadge = document.getElementById("group-percent-pill");
  progress.value = amount;
  progress.max = demoGroupGoal;

  const isDefaultReferenceState = amount === 8 && demoGroupGoal === 12;
  const pct = isDefaultReferenceState ? 68 : Math.min(100, Math.round((amount / Math.max(1, demoGroupGoal)) * 100));
  const kgAmount = isDefaultReferenceState ? 136 : Math.round((amount / Math.max(1, demoGroupGoal)) * 200);

  if (meterFill) {
    meterFill.style.transform = "scaleX(" + Math.max(0.03, Math.min(1, pct / 100)).toFixed(4) + ")";
  }
  if (pctBadge) {
    pctBadge.textContent = pct + "%";
    if (animateUpdate) {
      pulseElement(pctBadge, [
        { transform: "scale(0.92)" },
        { transform: "scale(1.12)" },
        { transform: "scale(1)" }
      ], 240);
    }
  }
  document.getElementById("group-title").textContent = demoGroupTitle;
  document.getElementById("group-progress-label").textContent = kgAmount + " kg / 200 kg (" + amount + " / " + demoGroupGoal + " giỏ mẫu)";
  document.getElementById("group-progress-note").textContent = demoGroupUnits
    ? "Đã ghi nhận " + demoGroupUnits + " giỏ mẫu trong phiên trình diễn trên thiết bị này (không tạo đơn thật)."
    : "Chưa có lượt thao tác trên trình duyệt này.";
}

function renderAdminOverview() {
  const pendingCount = orders.filter(function (order) { return order.status === "pending"; }).length;
  const stockUnits = products.reduce(function (sum, item) { return Math.min(Number.MAX_SAFE_INTEGER, sum + item.stock); }, 0);
  document.getElementById("admin-overview").innerHTML =
    '<div class="admin-metric"><span>Mặt hàng mẫu</span><strong>' + products.length + "</strong></div>" +
    '<div class="admin-metric"><span>Tổng tồn mẫu</span><strong>' + stockUnits + "</strong></div>" +
    '<div class="admin-metric"><span>Đơn chờ demo</span><strong>' + pendingCount + "</strong></div>" +
    '<div class="admin-metric"><span>Tổng đơn demo</span><strong>' + orders.length + "</strong></div>";
}

function renderAdminProducts() {
  const target = document.getElementById("admin-products");
  if (!products.length) {
    target.innerHTML = '<p class="admin-empty">Danh mục mẫu đang trống. Có thể thêm mặt hàng bên dưới.</p>';
    return;
  }
  target.innerHTML = '<div class="admin-table-wrap"><table class="admin-table"><caption>Giá và tồn kho chỉ dùng trong mô phỏng.</caption><thead><tr><th scope="col">Sản phẩm</th><th scope="col">Giá mẫu</th><th scope="col">Tồn mẫu</th><th scope="col">Thao tác</th></tr></thead><tbody>' +
    products.map(function (item) {
      return "<tr><td><strong>" + escapeHtml(item.name) + '</strong><br><span class="admin-subline">' + escapeHtml(item.unit) + " · " + escapeHtml(item.region) + "</span></td><td>" + formatCurrency(item.price) + "</td><td>" + item.stock + '</td><td><div class="admin-table-actions"><button class="button button-light button-small" type="button" data-edit-product="' + escapeHtml(item.id) + '">Sửa</button><button class="text-button" type="button" data-delete-product="' + escapeHtml(item.id) + '">Xóa</button></div></td></tr>';
    }).join("") + "</tbody></table></div>";
}

function renderAdminOrders() {
  const target = document.getElementById("admin-orders");
  if (!orders.length) {
    target.innerHTML = '<p class="admin-empty">Chưa có đơn demo. Tạo một đơn từ giỏ hàng để thử cách xác nhận, từ chối hoặc hết hạn.</p>';
    return;
  }
  target.innerHTML = '<div class="admin-order-list">' + orders.map(function (order) {
    const choices = statusTransitions[order.status] || [];
    const itemText = (order.lines || []).map(function (line) { return escapeHtml(line.name) + " × " + Number(line.quantity || 0); }).join(", ");
    const select = choices.length
      ? '<label class="visually-hidden" for="order-action-' + escapeHtml(order.code) + '">Cập nhật trạng thái ' + escapeHtml(order.code) + '</label><select id="order-action-' + escapeHtml(order.code) + '" data-order-action="' + escapeHtml(order.code) + '"><option value="">Chọn thao tác…</option>' + choices.map(function (status) {
        return '<option value="' + status + '">' + escapeHtml(statusLabels[status]) + "</option>";
      }).join("") + "</select>"
      : '<span class="admin-subline">Không còn thao tác tiếp theo</span>';
    return '<article class="admin-order-row"><div class="admin-order-head"><strong>' + escapeHtml(order.code) + "</strong><span>" + escapeHtml(statusLabels[order.status] || "Trạng thái demo") + "</span></div><p>" + (itemText || "Không có mặt hàng") + " · <strong>" + formatCurrency(order.total) + "</strong> · " + escapeHtml(formatTime(order.createdAt)) + '</p><div class="admin-order-controls">' + select + "</div></article>";
  }).join("") + "</div>";
}

function renderAdminGroup() {
  document.getElementById("admin-group-name").value = demoGroupTitle;
  document.getElementById("admin-group-goal").value = demoGroupGoal;
  document.getElementById("admin-group-summary").textContent =
    Math.min(demoGroupUnits, demoGroupGoal) + " / " + demoGroupGoal + " giỏ mẫu đã được chọn trong trình duyệt này.";
}

function renderAdmin() {
  renderAdminOverview();
  renderAdminProducts();
  renderAdminOrders();
  renderAdminGroup();
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  if (id === "admin-dialog") renderAdmin();
  if (id === "cart-dialog") {
    checkoutResult.innerHTML = "";
    renderCart();
  }
  if (id === "track-dialog") {
    renderRecentOrdersBar();
    const trackResult = document.getElementById("track-result");
    const trackCode = document.getElementById("track-code");
    if (!trackCode.value && orders.length) {
      trackCode.value = orders[0].code;
      renderTracking(orders[0]);
    } else if (!orders.length) {
      trackResult.innerHTML = "";
    }
  }
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog && typeof dialog.close === "function") dialog.close();
  else if (dialog) dialog.removeAttribute("open");
}

function showProductDetail(id) {
  const item = getProduct(id);
  if (!item) return;
  document.getElementById("product-detail").innerHTML =
    '<div class="detail-layout"><div class="detail-art">' + renderProductMedia(item) + '</div><div class="detail-copy">' +
    '<p class="product-meta"><span class="sim-pill">' + escapeHtml(item.category) + " · " + escapeHtml(item.unit) + "</span></p><h3>" + escapeHtml(item.name) + "</h3>" +
    "<p>" + escapeHtml(item.description) + '</p><dl class="detail-facts"><div><dt>Vùng trồng mẫu</dt><dd>' + escapeHtml(item.region) + "</dd></div><div><dt>Giá minh họa</dt><dd>" + formatCurrency(item.price) + " / " + escapeHtml(item.unit) + "</dd></div><div><dt>Tồn mẫu hiện có</dt><dd>" + item.stock + " " + escapeHtml(item.unit) + "</dd></div><div><dt>Nhãn trình diễn</dt><dd>" + escapeHtml(item.badge || "Nông sản mẫu") + "</dd></div></dl>" +
    '<p class="form-note">Thông tin chỉ phục vụ minh họa giao diện, không phải xác nhận nguồn gốc, chứng nhận chất lượng hay báo giá thị trường.</p><div style="margin-top:0.85rem"><button class="button button-dark button-wide" type="button" data-add-product="' + escapeHtml(item.id) + '"' + (item.stock <= 0 ? " disabled" : "") + ">Thêm vào giỏ demo</button></div></div></div>";
  openDialog("product-dialog");
}

function setAdminTab(tabName, fromKeyboard) {
  ["products", "orders", "group"].forEach(function (name) {
    const selected = tabName === name;
    document.getElementById("tab-" + name).setAttribute("aria-selected", String(selected));
    const panel = document.getElementById("admin-" + name + "-panel");
    panel.hidden = !selected;
    if (selected && !fromKeyboard) {
      pulseElement(panel, [
        { opacity: 0.45, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], 180);
    }
  });
}

function resetProductForm() {
  const form = document.getElementById("admin-product-form");
  form.reset();
  form.elements.productId.value = "";
  document.getElementById("admin-form-title").textContent = "Thêm sản phẩm mẫu";
  document.getElementById("admin-save-product").textContent = "Thêm sản phẩm";
  document.getElementById("admin-reset-form").hidden = true;
}

function editProduct(id) {
  const item = getProduct(id);
  if (!item) return;
  const form = document.getElementById("admin-product-form");
  form.elements.productId.value = item.id;
  form.elements.name.value = item.name;
  form.elements.category.value = item.category;
  form.elements.unit.value = item.unit;
  form.elements.price.value = item.price;
  form.elements.stock.value = item.stock;
  form.elements.region.value = item.region;
  form.elements.description.value = item.description;
  document.getElementById("admin-form-title").textContent = "Sửa sản phẩm mẫu";
  document.getElementById("admin-save-product").textContent = "Lưu thay đổi";
  document.getElementById("admin-reset-form").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  form.elements.name.focus();
}

function saveProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = form.elements;
  const price = Number(fields.price.value);
  const stock = Number(fields.stock.value);
  if (!String(fields.price.value).trim() || !String(fields.stock.value).trim() || !Number.isSafeInteger(price) || price < 1 || price > MAX_DEMO_PRICE || !Number.isSafeInteger(stock) || stock < 0 || stock > MAX_DEMO_STOCK) {
    showToast("Giá và tồn mẫu cần là số nguyên hợp lệ.");
    return;
  }
  const id = fields.productId.value || "demo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  const old = getProduct(id);
  const product = {
    id: id,
    name: fields.name.value.trim(),
    category: fields.category.value.trim(),
    unit: fields.unit.value.trim(),
    price: price,
    stock: stock,
    region: fields.region.value.trim(),
    description: fields.description.value.trim(),
    art: old ? old.art : "greens",
    image: old ? old.image : "",
    badge: old ? old.badge : "Mới thêm (mẫu)",
    badgeTone: old ? old.badgeTone : "green"
  };
  if (product.name.length < 2 || product.name.length > 56 || !product.category || product.category.length > 32 || !product.unit || product.unit.length > 20 || !product.region || product.region.length > 56 || !product.description || product.description.length > 180) {
    showToast("Hãy điền đầy đủ các trường sản phẩm mẫu.");
    return;
  }
  if (old) {
    products = products.map(function (item) { return item.id === id ? product : item; });
  } else {
    products.push(product);
    isCatalogExpanded = true;
  }
  persistAll();
  renderProducts();
  renderCart();
  renderMarketTable();
  renderAdmin();
  resetProductForm();
  showToast(old ? "Đã cập nhật sản phẩm demo." : "Đã thêm sản phẩm demo.");
}

function saveGroupSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.elements.title.value.trim();
  const goal = Number(form.elements.goal.value);
  if (title.length < 2 || !Number.isSafeInteger(goal) || goal < 1 || goal > 500) {
    showToast("Tên cần có ít nhất 2 ký tự và mục tiêu từ 1 đến 500 giỏ mẫu.");
    return;
  }
  demoGroupTitle = title.slice(0, 48);
  demoGroupGoal = goal;
  demoGroupUnits = Math.min(demoGroupUnits, demoGroupGoal);
  persistAll();
  renderGroupProgress();
  renderAdminGroup();
  showToast("Đã lưu chương trình mua chung demo.");
}

function resetGroupProgress() {
  if (!window.confirm("Đặt số lượt tham gia demo trên thiết bị này về 0?")) return;
  demoGroupUnits = 0;
  persistAll();
  renderGroupProgress();
  renderAdminGroup();
  showToast("Đã đặt lại tiến độ mua chung demo.");
}

function deleteProduct(id) {
  const item = getProduct(id);
  if (!item) return;
  const hasActiveReservation = orders.some(function (order) {
    if (order.inventoryReleased || ["pending", "confirmed", "preparing"].indexOf(order.status) < 0) return false;
    return (order.lines || []).some(function (line) { return line.productId === id; });
  });
  if (hasActiveReservation) {
    showToast("Không thể xóa mặt hàng đang được giữ trong đơn demo.");
    return;
  }
  if (!window.confirm("Xóa " + item.name + " khỏi danh mục demo? Lịch sử đơn đã tạo vẫn được giữ.")) return;
  products = products.filter(function (product) { return product.id !== id; });
  cart = cart.filter(function (line) { return line.id !== id; });
  persistAll();
  renderProducts();
  renderCart();
  renderMarketTable();
  renderAdmin();
  showToast("Đã xóa sản phẩm khỏi danh mục demo.");
}

function exportOrdersCsv() {
  if (!orders.length) {
    showToast("Chưa có đơn hàng demo để xuất CSV.");
    return;
  }
  const rows = [
    ["Mã đơn", "Thời gian tạo", "Trạng thái", "Hình thức mẫu", "Sản phẩm", "Tổng tiền (VND)"]
  ].concat(orders.map(function (order) {
    const itemsText = (order.lines || []).map(function (l) { return l.name + " x " + l.quantity; }).join("; ");
    return [
      order.code,
      formatTime(order.createdAt),
      statusLabels[order.status] || order.status,
      order.schedule || "Mô phỏng",
      itemsText,
      String(order.total)
    ];
  }));
  const csv = "\uFEFF" + rows.map(function (row) {
    return row.map(function (cell) { return '"' + String(cell || "").replace(/"/g, '""') + '"'; }).join(",");
  }).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "don-hang-demo-bao-tieu-xanh.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Đã xuất file CSV đơn hàng demo.");
}

function restoreDefaultDemoData() {
  if (!window.confirm("Khôi phục toàn bộ sản phẩm, giỏ hàng, đơn hàng và mua chung về trạng thái mẫu ban đầu?")) return;
  products = initialProducts.map(function (item) { return Object.assign({}, item); });
  cart = [];
  orders = [];
  demoGroupUnits = DEFAULT_GROUP_UNITS;
  demoGroupGoal = DEFAULT_GROUP_GOAL;
  demoGroupTitle = "Khoai lang Nhật";
  favorites.clear();
  activeCategory = "Tất cả";
  isCatalogExpanded = false;
  searchInput.value = "";
  regionFilter.value = "";
  priceFilter.value = "all";
  sortSelect.value = "featured";
  try { localStorage.removeItem(STORAGE_PREFIX + "motion"); } catch (_e) {}
  persistAll();
  renderProducts();
  renderCart();
  renderMarketTable();
  renderGroupProgress();
  renderAdmin();
  renderRecentOrdersBar();
  showToast("Đã khôi phục dữ liệu mẫu mặc định.");
}

function resetAllFilters() {
  searchInput.value = "";
  regionFilter.value = "";
  priceFilter.value = "all";
  sortSelect.value = "featured";
  activeCategory = "Tất cả";
  renderProducts();
}

document.addEventListener("click", function (event) {
  const openButton = event.target.closest("[data-open-dialog]");
  if (openButton) {
    openDialog(openButton.getAttribute("data-open-dialog"));
    return;
  }
  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton) {
    closeDialog(closeButton.getAttribute("data-close-dialog"));
    return;
  }
  const favButton = event.target.closest("[data-favorite-product]");
  if (favButton) {
    toggleFavorite(favButton.getAttribute("data-favorite-product"));
    return;
  }
  const addButton = event.target.closest("[data-add-product]");
  if (addButton) {
    addToCart(addButton.getAttribute("data-add-product"), addButton);
    if (addButton.closest("#product-dialog")) closeDialog("product-dialog");
    return;
  }
  const viewButton = event.target.closest("[data-view-product]");
  if (viewButton) {
    showProductDetail(viewButton.getAttribute("data-view-product"));
    return;
  }
  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) {
    activeCategory = categoryButton.getAttribute("data-category");
    renderProducts();
    return;
  }
  if (event.target.closest("[data-reset-filters]")) {
    resetAllFilters();
    searchInput.focus();
    return;
  }
  const filterRegionBtn = event.target.closest("[data-filter-region]");
  if (filterRegionBtn) {
    const region = filterRegionBtn.getAttribute("data-filter-region");
    closeDialog("farmer-dialog");
    searchInput.value = "";
    activeCategory = "Tất cả";
    priceFilter.value = "all";
    isCatalogExpanded = true;
    renderCategories();
    regionFilter.value = region;
    renderProducts();
    document.getElementById("san-pham").scrollIntoView({ behavior: "smooth" });
    showToast("Đang lọc nông sản vùng: " + region);
    return;
  }
  const removeButton = event.target.closest("[data-cart-remove]");
  if (removeButton) {
    removeCartLine(removeButton.getAttribute("data-cart-remove"));
    return;
  }
  const changeButton = event.target.closest("[data-cart-change]");
  if (changeButton) {
    changeCartQuantity(changeButton.getAttribute("data-id"), Number(changeButton.getAttribute("data-cart-change")));
    return;
  }
  const trackButton = event.target.closest("[data-track-code]");
  if (trackButton) {
    const code = trackButton.getAttribute("data-track-code");
    closeDialog("cart-dialog");
    openDialog("track-dialog");
    document.getElementById("track-code").value = code;
    renderTracking(findOrder(code));
    return;
  }
  const quickTrackBtn = event.target.closest("[data-quick-track]");
  if (quickTrackBtn) {
    const code = quickTrackBtn.getAttribute("data-quick-track");
    document.getElementById("track-code").value = code;
    renderTracking(findOrder(code));
    return;
  }
  const cancelOrderBtn = event.target.closest("[data-cancel-order]");
  if (cancelOrderBtn) {
    const code = cancelOrderBtn.getAttribute("data-cancel-order");
    if (window.confirm("Bạn muốn hủy đơn demo " + code + " và hoàn trả tồn mẫu?")) {
      transitionOrder(code, "cancelled");
    }
    return;
  }
  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) {
    editProduct(editButton.getAttribute("data-edit-product"));
    return;
  }
  const deleteButton = event.target.closest("[data-delete-product]");
  if (deleteButton) {
    deleteProduct(deleteButton.getAttribute("data-delete-product"));
    return;
  }
  if (event.target.closest("#tab-products")) {
    setAdminTab("products");
    return;
  }
  if (event.target.closest("#tab-orders")) {
    setAdminTab("orders");
    return;
  }
  if (event.target.closest("#tab-group")) {
    setAdminTab("group");
    return;
  }
  if (event.target.closest("#admin-group-reset")) {
    resetGroupProgress();
    return;
  }
  if (event.target.closest("#admin-reset-form")) {
    resetProductForm();
    return;
  }
  if (event.target.closest("#admin-export-orders")) {
    exportOrdersCsv();
    return;
  }
  if (event.target.closest("#admin-restore-defaults")) {
    restoreDefaultDemoData();
  }
});

if (toggleCatalogButton) {
  toggleCatalogButton.addEventListener("click", function () {
    if (hasActiveFilter()) {
      resetAllFilters();
      return;
    }
    isCatalogExpanded = !isCatalogExpanded;
    renderProducts();
  });
}

const searchShortcut = document.getElementById("search-shortcut");
if (searchShortcut) {
  searchShortcut.addEventListener("click", function () {
    document.getElementById("san-pham").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(function () { searchInput.focus(); }, 250);
  });
}

document.addEventListener("change", function (event) {
  if (event.target.matches("[data-order-action]")) {
    const code = event.target.getAttribute("data-order-action");
    const status = event.target.value;
    if (status) transitionOrder(code, status);
  }
});

searchInput.addEventListener("input", renderProducts);
regionFilter.addEventListener("change", renderProducts);
sortSelect.addEventListener("change", renderProducts);
priceFilter.addEventListener("change", renderProducts);
document.getElementById("cart-open").addEventListener("click", function () { openDialog("cart-dialog"); });
placeOrderButton.addEventListener("click", placeDemoOrder);

document.getElementById("track-form").addEventListener("submit", function (event) {
  event.preventDefault();
  expirePendingOrders();
  renderTracking(findOrder(document.getElementById("track-code").value));
});

document.getElementById("group-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const quantity = Math.max(1, Math.min(3, Number(document.getElementById("group-quantity").value) || 1));
  demoGroupUnits = Math.min(demoGroupGoal, demoGroupUnits + quantity);
  persistAll();
  renderGroupProgress(true);
  closeDialog("group-dialog");
  showToast("Đã cập nhật lượt tham gia mô phỏng trên thiết bị này.");
});

document.getElementById("admin-product-form").addEventListener("submit", saveProduct);
document.getElementById("admin-group-form").addEventListener("submit", saveGroupSettings);
document.getElementById("admin-reset-form").addEventListener("click", resetProductForm);

const menuToggle = document.getElementById("menu-toggle");
const mainNavigation = document.getElementById("main-navigation");
function setMenuOpen(open) {
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.querySelector(".visually-hidden").textContent = open ? "Đóng điều hướng" : "Mở điều hướng";
  mainNavigation.classList.toggle("is-open", open);
}

menuToggle.addEventListener("click", function () {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});
mainNavigation.addEventListener("click", function (event) {
  if (event.target.closest("a, button")) setMenuOpen(false);
});
document.addEventListener("click", function (event) {
  if (menuToggle.getAttribute("aria-expanded") === "true" && !event.target.closest("#menu-toggle, #main-navigation")) {
    setMenuOpen(false);
  }
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuToggle.focus();
    return;
  }
  const currentTab = event.target.closest && event.target.closest('[role="tab"]');
  if (!currentTab || ["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) < 0) return;
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const currentIndex = tabs.indexOf(currentTab);
  let nextIndex = currentIndex;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex + tabs.length - 1) % tabs.length;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;
  event.preventDefault();
  const nextTab = tabs[nextIndex];
  setAdminTab(nextTab.id.replace("tab-", ""), true);
  nextTab.focus();
});

document.querySelectorAll("dialog").forEach(function (dialog) {
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  });
});

let revealObserver = null;
let textRevealObserver = null;
let scrollVariantObserver = null;

function initTextReveal() {
  const headings = document.querySelectorAll("[data-text-reveal]");
  headings.forEach(function (heading) {
    if (heading.getAttribute("data-tr-ready") === "true") return;
    heading.setAttribute("data-tr-ready", "true");

    const fragment = document.createDocumentFragment();
    let wordIndex = 0;

    Array.from(heading.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const tokens = (node.textContent || "").split(/(\s+)/);
        tokens.forEach(function (token) {
          if (!token) return;
          if (/^\s+$/.test(token)) {
            fragment.appendChild(document.createTextNode(token));
          } else {
            const outer = document.createElement("span");
            outer.className = "tr-word";
            const inner = document.createElement("span");
            inner.className = "tr-word-inner";
            inner.style.setProperty("--word-i", String(wordIndex));
            inner.textContent = token;
            outer.appendChild(inner);
            fragment.appendChild(outer);
            wordIndex += 1;
          }
        });
      } else if (node.nodeName === "BR") {
        fragment.appendChild(document.createTextNode(" "));
        fragment.appendChild(document.createElement("br"));
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    });

    heading.innerHTML = "";
    heading.appendChild(fragment);
  });

  observeTextReveals();
}

function observeTextReveals() {
  const headings = document.querySelectorAll("[data-text-reveal]");
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    headings.forEach(function (heading) {
      heading.classList.remove("is-tr-staged");
      heading.classList.add("is-tr-entered");
    });
    return;
  }

  if (!textRevealObserver) {
    textRevealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-tr-staged");
          entry.target.classList.add("is-tr-entered");
        } else if (entry.boundingClientRect.top > (window.innerHeight || 800) * 0.92) {
          entry.target.classList.remove("is-tr-entered");
          entry.target.classList.add("is-tr-staged");
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
  }

  headings.forEach(function (heading) {
    if (heading.closest("#home")) {
      heading.classList.add("is-tr-staged");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          heading.classList.remove("is-tr-staged");
          heading.classList.add("is-tr-entered");
        });
      });
    } else {
      heading.classList.add("is-tr-staged");
      textRevealObserver.observe(heading);
    }
  });
}

let scrubWords = [];

function initScrollScrubText() {
  const headline = document.getElementById("sub-hero-scrub-headline");
  if (!headline || headline.getAttribute("data-scrub-ready") === "true") return;
  headline.setAttribute("data-scrub-ready", "true");

  const rawText = headline.textContent || "";
  const tokens = rawText.trim().split(/(\s+)/);
  const fragment = document.createDocumentFragment();
  scrubWords = [];

  tokens.forEach(function (token) {
    if (!token) return;
    if (/^\s+$/.test(token)) {
      fragment.appendChild(document.createTextNode(token));
    } else {
      const span = document.createElement("span");
      span.className = "scrub-word";
      span.textContent = token;
      fragment.appendChild(span);
      scrubWords.push(span);
    }
  });

  headline.innerHTML = "";
  headline.appendChild(fragment);
}

function observeReveals(root) {
  const scope = root || document;
  const elements = scope.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    elements.forEach(function (element) {
      element.classList.remove("is-staged");
      element.classList.add("has-entered");
    });
    return;
  }
  if (scope === productGrid) {
    elements.forEach(function (element) {
      element.classList.remove("has-entered");
      element.classList.add("is-staged");
    });
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        elements.forEach(function (element) {
          element.classList.remove("is-staged");
          element.classList.add("has-entered");
        });
      });
    });
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-staged");
          entry.target.classList.add("has-entered");
        } else if (entry.boundingClientRect.top > (window.innerHeight || 800) * 0.94) {
          entry.target.classList.remove("has-entered");
          entry.target.classList.add("is-staged");
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
  }
  elements.forEach(function (element) {
    if (!element.classList.contains("has-entered")) {
      element.classList.add("is-staged");
    }
    revealObserver.observe(element);
  });
}

function initScrollVariantEffects() {
  const groupSection = document.getElementById("mua-chung");
  if (!groupSection) return;
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    groupSection.setAttribute("data-scroll-variant", "to");
    return;
  }

  scrollVariantObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        groupSection.setAttribute("data-scroll-variant", "to");
        if (!prefersReducedMotion()) {
          animateGroupFlowingNumber();
        }
      } else {
        groupSection.setAttribute("data-scroll-variant", "from");
      }
    });
  }, { threshold: 0.35 });

  scrollVariantObserver.observe(groupSection);
}

function animateGroupFlowingNumber() {
  const pctBadge = document.getElementById("group-percent-pill");
  const meterFill = document.getElementById("group-meter-fill");
  if (!pctBadge || prefersReducedMotion()) return;

  const amount = Math.min(demoGroupGoal, Math.max(0, demoGroupUnits));
  const isDefaultReferenceState = amount === 8 && demoGroupGoal === 12;
  const targetPct = isDefaultReferenceState ? 68 : Math.min(100, Math.round((amount / Math.max(1, demoGroupGoal)) * 100));

  const startTime = performance.now();
  const duration = 950;

  if (meterFill) {
    meterFill.style.transform = "scaleX(0.08)";
    window.requestAnimationFrame(function () {
      meterFill.style.transform = "scaleX(" + Math.max(0.03, Math.min(1, targetPct / 100)).toFixed(4) + ")";
    });
  }

  function step(now) {
    if (prefersReducedMotion()) {
      pctBadge.textContent = targetPct + "%";
      return;
    }
    const elapsed = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    const currentVal = Math.round(eased * targetPct);
    pctBadge.textContent = currentVal + "%";
    if (elapsed < 1) {
      window.requestAnimationFrame(step);
    } else {
      pctBadge.textContent = targetPct + "%";
    }
  }

  window.requestAnimationFrame(step);
}

function initFramerScrollEffects() {
  const progressBar = document.getElementById("scroll-progress-bar");
  const siteHeader = document.getElementById("site-header");
  const heroCard = document.getElementById("hero-image-card");
  const subHeroSection = document.getElementById("sub-hero-manifesto");
  const subHeroSteps = Array.from(document.querySelectorAll("#sub-hero-variant-rail .sub-hero-step"));
  const parallaxNodes = Array.from(document.querySelectorAll("[data-parallax-speed]"));
  let ticking = false;

  function updateScroll() {
    ticking = false;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const vh = window.innerHeight || 800;
    const docHeight = Math.max(1, document.documentElement.scrollHeight - vh);
    const ratio = Math.min(1, Math.max(0, scrollTop / docHeight));

    if (progressBar) {
      progressBar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }
    if (siteHeader) {
      siteHeader.classList.toggle("is-scrolled", scrollTop > 18);
    }

    /* Sub-Hero Scroll-Scrubbed Text Reveal (iwKWyOoan withTextReveal & fYpWaNEya scrollVariantEffect) */
    if (subHeroSection && scrubWords.length) {
      if (prefersReducedMotion()) {
        scrubWords.forEach(function (w) {
          w.style.setProperty("--word-opacity", "1");
          w.style.setProperty("--word-y", "0px");
        });
      } else {
        const subRect = subHeroSection.getBoundingClientRect();
        const startY = vh * 0.88;
        const endY = vh * 0.28;
        const rawProgress = (startY - subRect.top) / Math.max(1, startY - endY);
        const progress = Math.min(1, Math.max(0, rawProgress));
        const total = scrubWords.length;

        scrubWords.forEach(function (word, idx) {
          const wordStart = (idx / total) * 0.78;
          const wordProgress = Math.min(1, Math.max(0, (progress - wordStart) / 0.22));
          const opacity = 0.18 + wordProgress * 0.82;
          const yOffset = (1 - wordProgress) * 9;
          word.style.setProperty("--word-opacity", opacity.toFixed(2));
          word.style.setProperty("--word-y", yOffset.toFixed(1) + "px");
        });

        const activeStep = progress < 0.36 ? 1 : (progress < 0.72 ? 2 : 3);
        subHeroSteps.forEach(function (stepNode) {
          const stepNum = Number(stepNode.getAttribute("data-step"));
          stepNode.classList.toggle("is-active", stepNum === activeStep);
        });
      }
    }

    const viewportWidth = window.innerWidth || 1200;
    if (prefersReducedMotion() || viewportWidth < 810) {
      parallaxNodes.forEach(function (node) {
        node.style.setProperty("--parallax-y", "0px");
      });
      document.documentElement.style.setProperty("--scroll-rotate", "-18deg");
      document.documentElement.style.setProperty("--decor-y", "0px");
      if (heroCard) heroCard.style.setProperty("--hero-scroll-scale", "1");
      return;
    }

    const bpFactor = viewportWidth >= 1200 ? 1 : 0.48;

    /* loHhh3Amj styleTransformEffect: rotate from -35deg to 38deg on scroll */
    const rotateDeg = -35 + ratio * 73;
    const decorY = (ratio - 0.5) * -54 * bpFactor;
    document.documentElement.style.setProperty("--scroll-rotate", rotateDeg.toFixed(2) + "deg");
    document.documentElement.style.setProperty("--decor-y", decorY.toFixed(1) + "px");

    /* Hero parallaxEffect (speeds 140, 180, -80) & b3y0Udg0m scroll transform */
    const clampedHeroScroll = Math.min(720, Math.max(0, scrollTop));
    parallaxNodes.forEach(function (node) {
      const speed = Number(node.getAttribute("data-parallax-speed")) || 0;
      const offset = -(clampedHeroScroll * (speed / 1000) * 0.68 * bpFactor);
      node.style.setProperty("--parallax-y", offset.toFixed(1) + "px");
    });

    if (heroCard) {
      const heroRatio = Math.min(1, clampedHeroScroll / 620);
      const scaleVal = 1 + heroRatio * 0.055 * bpFactor;
      heroCard.style.setProperty("--hero-scroll-scale", scaleVal.toFixed(4));
    }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });

  window.addEventListener("resize", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });

  updateScroll();
}

function initInteractiveTiltAndSpotlight() {
  let activeCard = null;

  function resetCard(card) {
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  }

  document.addEventListener("pointermove", function (event) {
    if (prefersReducedMotion() || event.pointerType === "touch") return;
    const card = event.target.closest && event.target.closest(".product-card, .bento-card");
    if (activeCard && activeCard !== card) {
      resetCard(activeCard);
    }
    activeCard = card;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = Math.min(1, Math.max(0, x / rect.width));
    const py = Math.min(1, Math.max(0, y / rect.height));
    const maxTilt = card.classList.contains("product-card") ? 5 : 3;
    const tiltX = (0.5 - py) * maxTilt;
    const tiltY = (px - 0.5) * (maxTilt + 1);

    card.style.setProperty("--spot-x", x.toFixed(1) + "px");
    card.style.setProperty("--spot-y", y.toFixed(1) + "px");
    card.style.setProperty("--tilt-x", tiltX.toFixed(2) + "deg");
    card.style.setProperty("--tilt-y", tiltY.toFixed(2) + "deg");
  }, { passive: true });

  document.addEventListener("pointerleave", function () {
    if (activeCard) {
      resetCard(activeCard);
      activeCard = null;
    }
  }, { passive: true });
}

function initMotionToggle() {
  const toggleBtn = document.getElementById("motion-toggle");
  const labelSpan = document.getElementById("motion-label");
  const respectOsFlag = window.location.search.indexOf("respect-os-motion=1") >= 0;
  const osReduced = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const savedMotion = readStorage("motion-user-choice", null);
  const initialEnabled = savedMotion === "off"
    ? false
    : (respectOsFlag && osReduced ? false : true);

  function applyMotionState(enabled, isManualToggle) {
    document.documentElement.setAttribute("data-motion", enabled ? "force-on" : "off");
    if (isManualToggle) {
      writeStorage("motion-user-choice", enabled ? "force-on" : "off");
    }

    if (toggleBtn) {
      toggleBtn.setAttribute("aria-pressed", String(enabled));
      toggleBtn.setAttribute("title", enabled ? "Đang bật hiệu ứng chuyển động (Bấm để tắt)" : "Đang tắt hiệu ứng chuyển động (Bấm để bật)");
    }
    if (labelSpan) {
      labelSpan.textContent = enabled ? "Hiệu ứng" : "Tắt hiệu ứng";
    }

    if (!enabled) {
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.remove("is-staged");
        el.classList.add("has-entered");
      });
      document.querySelectorAll("[data-text-reveal]").forEach(function (el) {
        el.classList.remove("is-tr-staged");
        el.classList.add("is-tr-entered");
      });
      document.querySelectorAll("[data-parallax-speed]").forEach(function (el) {
        el.style.setProperty("--parallax-y", "0px");
      });
      scrubWords.forEach(function (w) {
        w.style.setProperty("--word-opacity", "1");
        w.style.setProperty("--word-y", "0px");
      });
    } else if (isManualToggle) {
      observeTextReveals();
      observeReveals(document);
    }

    if (isManualToggle) {
      showToast(enabled ? "Đã bật hiệu ứng chuyển động Framer Motion." : "Đã tắt hiệu ứng chuyển động.");
    }
  }

  applyMotionState(initialEnabled, false);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      const currentlyOff = prefersReducedMotion();
      applyMotionState(currentlyOff, true);
    });
  }
}

initMotionToggle();
initTextReveal();
initScrollScrubText();
initFramerScrollEffects();
initScrollVariantEffects();
initInteractiveTiltAndSpotlight();
expirePendingOrders();
renderProducts();
renderCart();
renderMarketTable();
renderGroupProgress();
renderAdmin();
renderRecentOrdersBar();
observeReveals(document);
if (storageRepairNotice) {
  persistAll();
  showToast("Dữ liệu demo đã lưu được kiểm tra và chuẩn hóa trên trình duyệt này.");
}
window.setInterval(expirePendingOrders, 60 * 1000);
