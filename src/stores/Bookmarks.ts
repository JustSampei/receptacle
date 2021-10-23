import { writable } from 'svelte/store';

const bookmarks_stored: string = localStorage.bookmarks;

export const bookmarks_store = writable(JSON.parse(bookmarks_stored) || JSON.parse('[]'));

bookmarks_store.subscribe((value) => localStorage.bookmarks = value);
