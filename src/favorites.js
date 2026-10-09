
import { FAV_KEY } from "./state.js";

export function getFavs() {
  return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
}

export function setFavs(ids) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export function toggleFav(id) {
  const favs = getFavs();

  const updated = favs.includes(id)
    ? favs.filter((x) => x !== id)
    : [id, ...favs];

  setFavs(updated);
}
