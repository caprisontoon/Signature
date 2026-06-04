import type { GalleryEntry } from "@/types";
import { GALLERY_KEY } from "./constants";

export async function loadGallery(): Promise<GalleryEntry[]> {
  try {
    const w = window as any;
    if (w.storage && w.storage.get) {
      const res = await w.storage.get(GALLERY_KEY);
      if (res && res.value) return JSON.parse(res.value);
    }
  } catch (e) { /* not present */ }
  return [];
}

async function saveGalleryList(list: GalleryEntry[]): Promise<boolean> {
  try {
    const w = window as any;
    if (w.storage && w.storage.set) {
      await w.storage.set(GALLERY_KEY, JSON.stringify(list));
      return true;
    }
  } catch (e) { console.error(e); }
  (window as any)._memGallery = list;
  return false;
}

async function getGalleryListSafe(): Promise<GalleryEntry[]> {
  let list = await loadGallery();
  if ((!list || list.length === 0) && (window as any)._memGallery) {
    list = (window as any)._memGallery;
  }
  return list || [];
}

export async function saveToGallery(name: string, dataURL: string): Promise<void> {
  const list = await getGalleryListSafe();
  const entry: GalleryEntry = {
    id: "sig_" + Date.now(),
    name,
    dataURL,
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  if (list.length > 30) list.length = 30;
  await saveGalleryList(list);
}

export async function deleteFromGallery(id: string): Promise<void> {
  const list = await getGalleryListSafe();
  const filtered = list.filter((e) => e.id !== id);
  await saveGalleryList(filtered);
}

export async function renderGallery(
  gridEl: HTMLElement,
  emptyEl: HTMLElement,
  onDownload: (entry: GalleryEntry) => void,
  onDelete: (entry: GalleryEntry) => void,
  onRequest: (entry: GalleryEntry) => void
): Promise<void> {
  const list = await getGalleryListSafe();
  gridEl.innerHTML = "";
  if (list.length === 0) {
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";
  list.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    const date = new Date(entry.createdAt);
    const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}.${String(date.getFullYear()).slice(2)}`;
    item.innerHTML = `
      <img src="${entry.dataURL}" alt="${entry.name}">
      <div class="gallery-meta">
        <div class="gallery-name">${entry.name}</div>
        <div class="gallery-date">${dateStr}</div>
      </div>
      <div class="gallery-actions">
        <button class="icon-btn req" data-action="request">사용요청</button>
        <button class="icon-btn" data-action="download">PNG</button>
        <button class="icon-btn del" data-action="delete">Del</button>
      </div>
    `;
    item.querySelector('[data-action="download"]')!.addEventListener("click", () => onDownload(entry));
    item.querySelector('[data-action="delete"]')!.addEventListener("click", () => onDelete(entry));
    item.querySelector('[data-action="request"]')!.addEventListener("click", () => onRequest(entry));
    gridEl.appendChild(item);
  });
}
