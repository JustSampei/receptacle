import { writable } from 'svelte/store';

const bookmarks_stored = localStorage.getItem('bookmarks');

let bookmarks;

try {
	bookmarks = writable(JSON.parse(bookmarks_stored));
} catch (error) {
	bookmarks = writable([]);
}

if (bookmarks == undefined) bookmarks = writable([]);

export const bookmarks_store = bookmarks

bookmarks_store.subscribe((value) => localStorage.setItem('bookmarks', JSON.stringify(value)));
