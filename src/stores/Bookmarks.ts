import { writable } from 'svelte/store';

let bookmarks_stored = localStorage.getItem('bookmarks');

if (!bookmarks_stored ) bookmarks_stored = "[]";

let bookmarks;

try {
	bookmarks = writable(JSON.parse(bookmarks_stored));
} catch (error) {
	bookmarks = writable([]);
}

if (bookmarks == undefined) bookmarks = writable([]);

export const bookmarks_store = bookmarks

bookmarks_store.subscribe((value) => localStorage.setItem('bookmarks', JSON.stringify(value)));
