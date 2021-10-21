
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/SearchBar.svelte generated by Svelte v3.44.0 */
    const file$7 = "src/components/SearchBar.svelte";

    function create_fragment$7(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let input;
    	let t1;
    	let span;
    	let i;
    	let t2;
    	let div3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			span = element("span");
    			i = element("i");
    			t2 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "column is-3");
    			add_location(div0, file$7, 8, 2, 138);
    			attr_dev(input, "class", "input is-rounded is-ubuntu svelte-13xj05k");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search for recipes...");
    			add_location(input, file$7, 11, 4, 234);
    			attr_dev(i, "class", "fas fa-search has-text-black-ter svelte-13xj05k");
    			add_location(i, file$7, 17, 5, 408);
    			attr_dev(span, "class", "icon is-right");
    			add_location(span, file$7, 16, 4, 350);
    			attr_dev(div1, "class", "control has-icons-right");
    			add_location(div1, file$7, 10, 3, 192);
    			attr_dev(div2, "class", "column");
    			add_location(div2, file$7, 9, 2, 168);
    			attr_dev(div3, "class", "column is-3");
    			add_location(div3, file$7, 21, 2, 488);
    			attr_dev(div4, "class", "columns");
    			add_location(div4, file$7, 7, 1, 114);
    			attr_dev(div5, "class", "container block");
    			add_location(div5, file$7, 6, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			append_dev(div1, t1);
    			append_dev(div1, span);
    			append_dev(span, i);
    			append_dev(div4, t2);
    			append_dev(div4, div3);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", handleSearch, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleSearch() {
    	
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SearchBar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SearchBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ App, handleSearch });
    	return [];
    }

    class SearchBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/CardReceipt.svelte generated by Svelte v3.44.0 */

    const file$6 = "src/components/CardReceipt.svelte";

    function create_fragment$6(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let p0;
    	let t2;
    	let p1;
    	let t4;
    	let div2;
    	let button;
    	let span;
    	let i;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Pizza";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Second Pizza";
    			t4 = space();
    			div2 = element("div");
    			button = element("button");
    			span = element("span");
    			i = element("i");
    			attr_dev(img, "class", "has-border-left-or-top-radius-special svelte-1dw61qo");
    			if (!src_url_equal(img.src, img_src_value = "https://bulma.io/images/placeholders/128x128.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$6, 4, 4, 176);
    			attr_dev(figure, "class", "image is-3by2");
    			add_location(figure, file$6, 3, 3, 141);
    			attr_dev(div0, "class", "column is-4 has-no-padding svelte-1dw61qo");
    			add_location(div0, file$6, 2, 2, 97);
    			attr_dev(p0, "class", "subtitle is-ubuntu is-4 has-text-weight-bold svelte-1dw61qo");
    			add_location(p0, file$6, 11, 3, 370);
    			attr_dev(p1, "class", "subtitle is-ubuntu is-6 svelte-1dw61qo");
    			add_location(p1, file$6, 12, 3, 439);
    			attr_dev(div1, "class", "column is-4 has-text-centered");
    			add_location(div1, file$6, 10, 2, 323);
    			attr_dev(i, "class", "far fa-bookmark");
    			add_location(i, file$6, 17, 5, 643);
    			attr_dev(span, "class", "icon is-medium has-text-centered");
    			add_location(span, file$6, 16, 4, 590);
    			attr_dev(button, "class", "button is-rounded is-ubuntu svelte-1dw61qo");
    			add_location(button, file$6, 15, 3, 541);
    			attr_dev(div2, "class", "column has-text-right");
    			add_location(div2, file$6, 14, 2, 502);
    			attr_dev(div3, "class", "columns is-mobile is-vcentered svelte-1dw61qo");
    			add_location(div3, file$6, 1, 1, 50);
    			attr_dev(div4, "class", "box container has-no-padding block svelte-1dw61qo");
    			add_location(div4, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, figure);
    			append_dev(figure, img);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(button, span);
    			append_dev(span, i);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CardReceipt', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CardReceipt> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CardReceipt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CardReceipt",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Pagination.svelte generated by Svelte v3.44.0 */

    const file$5 = "src/components/Pagination.svelte";

    function create_fragment$5(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let button0;
    	let span0;
    	let i0;
    	let t0;
    	let span1;
    	let t2;
    	let div1;
    	let p;
    	let t4;
    	let div2;
    	let button1;
    	let span2;
    	let t6;
    	let span3;
    	let i1;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			i0 = element("i");
    			t0 = space();
    			span1 = element("span");
    			span1.textContent = "Previous";
    			t2 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "1 / 2";
    			t4 = space();
    			div2 = element("div");
    			button1 = element("button");
    			span2 = element("span");
    			span2.textContent = "Next";
    			t6 = space();
    			span3 = element("span");
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-chevron-left");
    			add_location(i0, file$5, 5, 5, 202);
    			attr_dev(span0, "class", "icon is-medium has-text-centered");
    			add_location(span0, file$5, 4, 4, 149);
    			attr_dev(span1, "class", "is-ubuntu svelte-73715y");
    			add_location(span1, file$5, 7, 4, 252);
    			attr_dev(button0, "class", "button is-rounded");
    			add_location(button0, file$5, 3, 3, 110);
    			attr_dev(div0, "class", "column has-text-left");
    			add_location(div0, file$5, 2, 2, 72);
    			attr_dev(p, "class", "subtitle is-ubuntu svelte-73715y");
    			add_location(p, file$5, 11, 3, 358);
    			attr_dev(div1, "class", "column has-text-centered");
    			add_location(div1, file$5, 10, 2, 316);
    			attr_dev(span2, "class", "is-ubuntu svelte-73715y");
    			add_location(span2, file$5, 15, 4, 487);
    			attr_dev(i1, "class", "fas fa-chevron-right");
    			add_location(i1, file$5, 17, 5, 580);
    			attr_dev(span3, "class", "icon is-medium has-text-centered");
    			add_location(span3, file$5, 16, 4, 527);
    			attr_dev(button1, "class", "button is-rounded");
    			add_location(button1, file$5, 14, 3, 448);
    			attr_dev(div2, "class", "column has-text-right");
    			add_location(div2, file$5, 13, 2, 409);
    			attr_dev(div3, "class", "columns is-vcentered is-mobile");
    			add_location(div3, file$5, 1, 1, 25);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(button0, span0);
    			append_dev(span0, i0);
    			append_dev(button0, t0);
    			append_dev(button0, span1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(button1, span2);
    			append_dev(button1, t6);
    			append_dev(button1, span3);
    			append_dev(span3, i1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pagination', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/ReceiptList.svelte generated by Svelte v3.44.0 */
    const file$4 = "src/components/ReceiptList.svelte";

    function create_fragment$4(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let cardreceipt0;
    	let t1;
    	let cardreceipt1;
    	let t2;
    	let cardreceipt2;
    	let t3;
    	let cardreceipt3;
    	let t4;
    	let pagination;
    	let t5;
    	let div2;
    	let current;
    	cardreceipt0 = new CardReceipt({ $$inline: true });
    	cardreceipt1 = new CardReceipt({ $$inline: true });
    	cardreceipt2 = new CardReceipt({ $$inline: true });
    	cardreceipt3 = new CardReceipt({ $$inline: true });
    	pagination = new Pagination({ $$inline: true });

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			create_component(cardreceipt0.$$.fragment);
    			t1 = space();
    			create_component(cardreceipt1.$$.fragment);
    			t2 = space();
    			create_component(cardreceipt2.$$.fragment);
    			t3 = space();
    			create_component(cardreceipt3.$$.fragment);
    			t4 = space();
    			create_component(pagination.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "column");
    			add_location(div0, file$4, 8, 3, 225);
    			attr_dev(div1, "class", "column is-10");
    			add_location(div1, file$4, 9, 3, 251);
    			attr_dev(div2, "class", "column");
    			add_location(div2, file$4, 17, 3, 414);
    			attr_dev(div3, "class", "columns is-centered is-fullwidth mb-6");
    			add_location(div3, file$4, 7, 2, 170);
    			attr_dev(div4, "class", "column");
    			add_location(div4, file$4, 6, 1, 147);
    			attr_dev(div5, "class", "container block");
    			add_location(div5, file$4, 5, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(cardreceipt0, div1, null);
    			append_dev(div1, t1);
    			mount_component(cardreceipt1, div1, null);
    			append_dev(div1, t2);
    			mount_component(cardreceipt2, div1, null);
    			append_dev(div1, t3);
    			mount_component(cardreceipt3, div1, null);
    			append_dev(div1, t4);
    			mount_component(pagination, div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardreceipt0.$$.fragment, local);
    			transition_in(cardreceipt1.$$.fragment, local);
    			transition_in(cardreceipt2.$$.fragment, local);
    			transition_in(cardreceipt3.$$.fragment, local);
    			transition_in(pagination.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardreceipt0.$$.fragment, local);
    			transition_out(cardreceipt1.$$.fragment, local);
    			transition_out(cardreceipt2.$$.fragment, local);
    			transition_out(cardreceipt3.$$.fragment, local);
    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(cardreceipt0);
    			destroy_component(cardreceipt1);
    			destroy_component(cardreceipt2);
    			destroy_component(cardreceipt3);
    			destroy_component(pagination);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ReceiptList', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ReceiptList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ CardReceipt, Pagination });
    	return [];
    }

    class ReceiptList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReceiptList",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Features.svelte generated by Svelte v3.44.0 */

    const file$3 = "src/components/Features.svelte";

    function create_fragment$3(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let button0;
    	let span0;
    	let i0;
    	let t1;
    	let span1;
    	let t3;
    	let div2;
    	let button1;
    	let span2;
    	let i1;
    	let t4;
    	let span3;
    	let t6;
    	let div3;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			i0 = element("i");
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Add receipt";
    			t3 = space();
    			div2 = element("div");
    			button1 = element("button");
    			span2 = element("span");
    			i1 = element("i");
    			t4 = space();
    			span3 = element("span");
    			span3.textContent = "Bookmarks";
    			t6 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "column");
    			add_location(div0, file$3, 2, 2, 90);
    			attr_dev(i0, "class", "fas fa-receipt");
    			add_location(i0, file$3, 6, 5, 254);
    			attr_dev(span0, "class", "icon is-medium has-text-centered");
    			add_location(span0, file$3, 5, 4, 201);
    			attr_dev(span1, "class", "is-ubuntu svelte-73715y");
    			add_location(span1, file$3, 8, 4, 299);
    			attr_dev(button0, "class", "button is-rounded");
    			add_location(button0, file$3, 4, 3, 162);
    			attr_dev(div1, "class", "column is-5 has-text-centered");
    			add_location(div1, file$3, 3, 2, 115);
    			attr_dev(i1, "class", "fas fa-bookmark");
    			add_location(i1, file$3, 14, 5, 505);
    			attr_dev(span2, "class", "icon is-medium has-text-centered");
    			add_location(span2, file$3, 13, 4, 452);
    			attr_dev(span3, "class", "is-ubuntu svelte-73715y");
    			add_location(span3, file$3, 16, 4, 551);
    			attr_dev(button1, "class", "button is-rounded");
    			add_location(button1, file$3, 12, 3, 413);
    			attr_dev(div2, "class", "column is-5 has-text-centered");
    			add_location(div2, file$3, 11, 2, 366);
    			attr_dev(div3, "class", "column");
    			add_location(div3, file$3, 19, 2, 616);
    			attr_dev(div4, "class", "columns is-mobile is-centered is-vcentered");
    			add_location(div4, file$3, 1, 1, 31);
    			attr_dev(div5, "class", "container block");
    			add_location(div5, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div1, button0);
    			append_dev(button0, span0);
    			append_dev(span0, i0);
    			append_dev(button0, t1);
    			append_dev(button0, span1);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, button1);
    			append_dev(button1, span2);
    			append_dev(span2, i1);
    			append_dev(button1, t4);
    			append_dev(button1, span3);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Features', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Features> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Features extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Features",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Ingridient.svelte generated by Svelte v3.44.0 */

    const file$2 = "src/components/Ingridient.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let span1;
    	let span0;
    	let i;
    	let t0;
    	let p0;
    	let t2;
    	let p1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			i = element("i");
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Number \t ";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Ingrediente";
    			attr_dev(i, "class", "fas fa-check");
    			add_location(i, file$2, 3, 3, 98);
    			attr_dev(span0, "class", "icon");
    			add_location(span0, file$2, 2, 2, 75);
    			attr_dev(p0, "class", "is-ubuntu svelte-73715y");
    			add_location(p0, file$2, 5, 2, 137);
    			attr_dev(p1, "class", "is-ubuntu svelte-73715y");
    			add_location(p1, file$2, 6, 2, 179);
    			attr_dev(span1, "class", "icon-text");
    			add_location(span1, file$2, 1, 1, 48);
    			attr_dev(div, "class", "column is-half has-text-centered");
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, span0);
    			append_dev(span0, i);
    			append_dev(span1, t0);
    			append_dev(span1, p0);
    			append_dev(span1, t2);
    			append_dev(span1, p1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ingridient', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ingridient> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Ingridient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ingridient",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Receipt.svelte generated by Svelte v3.44.0 */
    const file$1 = "src/components/Receipt.svelte";

    function create_fragment$1(ctx) {
    	let div21;
    	let div20;
    	let div0;
    	let t0;
    	let div18;
    	let div17;
    	let figure;
    	let img;
    	let img_src_value;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let p0;
    	let t3;
    	let div2;
    	let button0;
    	let span0;
    	let i0;
    	let t4;
    	let span1;
    	let t6;
    	let div12;
    	let div11;
    	let div5;
    	let span4;
    	let span2;
    	let i1;
    	let t7;
    	let span3;
    	let t9;
    	let div10;
    	let div9;
    	let div6;
    	let button1;
    	let span5;
    	let i2;
    	let t10;
    	let div7;
    	let span9;
    	let span6;
    	let i3;
    	let t11;
    	let span7;
    	let t13;
    	let span8;
    	let t15;
    	let div8;
    	let button2;
    	let span10;
    	let i4;
    	let t16;
    	let nav0;
    	let t17;
    	let div13;
    	let p1;
    	let t19;
    	let div15;
    	let div14;
    	let ingridient0;
    	let t20;
    	let ingridient1;
    	let t21;
    	let ingridient2;
    	let t22;
    	let ingridient3;
    	let t23;
    	let nav1;
    	let t24;
    	let div16;
    	let button3;
    	let span11;
    	let i5;
    	let t25;
    	let span12;
    	let t27;
    	let div19;
    	let current;
    	ingridient0 = new Ingridient({ $$inline: true });
    	ingridient1 = new Ingridient({ $$inline: true });
    	ingridient2 = new Ingridient({ $$inline: true });
    	ingridient3 = new Ingridient({ $$inline: true });

    	const block = {
    		c: function create() {
    			div21 = element("div");
    			div20 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div18 = element("div");
    			div17 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Pizza";
    			t3 = space();
    			div2 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			i0 = element("i");
    			t4 = space();
    			span1 = element("span");
    			span1.textContent = "Add to bookmarks";
    			t6 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div5 = element("div");
    			span4 = element("span");
    			span2 = element("span");
    			i1 = element("i");
    			t7 = space();
    			span3 = element("span");
    			span3.textContent = "60 Min";
    			t9 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div6 = element("div");
    			button1 = element("button");
    			span5 = element("span");
    			i2 = element("i");
    			t10 = space();
    			div7 = element("div");
    			span9 = element("span");
    			span6 = element("span");
    			i3 = element("i");
    			t11 = space();
    			span7 = element("span");
    			span7.textContent = "3  ";
    			t13 = space();
    			span8 = element("span");
    			span8.textContent = "Servings";
    			t15 = space();
    			div8 = element("div");
    			button2 = element("button");
    			span10 = element("span");
    			i4 = element("i");
    			t16 = space();
    			nav0 = element("nav");
    			t17 = space();
    			div13 = element("div");
    			p1 = element("p");
    			p1.textContent = "Recipe Ingridients";
    			t19 = space();
    			div15 = element("div");
    			div14 = element("div");
    			create_component(ingridient0.$$.fragment);
    			t20 = space();
    			create_component(ingridient1.$$.fragment);
    			t21 = space();
    			create_component(ingridient2.$$.fragment);
    			t22 = space();
    			create_component(ingridient3.$$.fragment);
    			t23 = space();
    			nav1 = element("nav");
    			t24 = space();
    			div16 = element("div");
    			button3 = element("button");
    			span11 = element("span");
    			i5 = element("i");
    			t25 = space();
    			span12 = element("span");
    			span12.textContent = "How to cook";
    			t27 = space();
    			div19 = element("div");
    			attr_dev(div0, "class", "column");
    			add_location(div0, file$1, 6, 2, 132);
    			attr_dev(img, "alt", "immagine ricetta");
    			attr_dev(img, "class", "image-receipt svelte-3nq91f");
    			if (!src_url_equal(img.src, img_src_value = "https://bulma.io/images/placeholders/128x128.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 10, 5, 298);
    			attr_dev(figure, "class", "image is-3by2 block");
    			add_location(figure, file$1, 9, 4, 256);
    			attr_dev(p0, "class", "title is-ubuntu svelte-3nq91f");
    			add_location(p0, file$1, 19, 7, 602);
    			attr_dev(div1, "class", "column is-half has-text-centered");
    			add_location(div1, file$1, 18, 6, 548);
    			attr_dev(i0, "class", "far fa-bookmark");
    			add_location(i0, file$1, 24, 9, 812);
    			attr_dev(span0, "class", "icon is-medium has-text-centered");
    			add_location(span0, file$1, 23, 8, 755);
    			attr_dev(span1, "class", "is-ubuntu svelte-3nq91f");
    			add_location(span1, file$1, 26, 8, 866);
    			attr_dev(button0, "class", "button is-rounded");
    			add_location(button0, file$1, 22, 7, 712);
    			attr_dev(div2, "class", "column is-half has-text-centered");
    			add_location(div2, file$1, 21, 6, 658);
    			attr_dev(div3, "class", "columns is-multiline is-vcentered is-centered");
    			add_location(div3, file$1, 17, 5, 482);
    			attr_dev(div4, "class", "container block");
    			add_location(div4, file$1, 16, 4, 447);
    			attr_dev(i1, "class", "fas fa-clock");
    			add_location(i1, file$1, 36, 9, 1202);
    			attr_dev(span2, "class", "icon");
    			add_location(span2, file$1, 35, 8, 1173);
    			attr_dev(span3, "class", "is-ubuntu svelte-3nq91f");
    			add_location(span3, file$1, 38, 8, 1253);
    			attr_dev(span4, "class", "icon-text");
    			add_location(span4, file$1, 34, 7, 1140);
    			attr_dev(div5, "class", "column is-half has-text-centered");
    			add_location(div5, file$1, 33, 6, 1086);
    			attr_dev(i2, "class", "fas fa-minus");
    			add_location(i2, file$1, 48, 11, 1608);
    			attr_dev(span5, "class", "icon is-medium");
    			add_location(span5, file$1, 47, 10, 1567);
    			attr_dev(button1, "class", "button is-rounded");
    			add_location(button1, file$1, 46, 9, 1522);
    			attr_dev(div6, "class", "column has-text-centered");
    			add_location(div6, file$1, 45, 8, 1474);
    			attr_dev(i3, "class", "fas fa-user-friends");
    			add_location(i3, file$1, 55, 11, 1817);
    			attr_dev(span6, "class", "icon");
    			add_location(span6, file$1, 54, 10, 1786);
    			attr_dev(span7, "class", "is-ubuntu svelte-3nq91f");
    			add_location(span7, file$1, 57, 10, 1879);
    			attr_dev(span8, "class", "is-ubuntu svelte-3nq91f");
    			add_location(span8, file$1, 60, 10, 1952);
    			attr_dev(span9, "class", "icon-text");
    			add_location(span9, file$1, 53, 9, 1751);
    			attr_dev(div7, "class", "column is-half has-text-centered");
    			add_location(div7, file$1, 52, 8, 1695);
    			attr_dev(i4, "class", "fas fa-plus");
    			add_location(i4, file$1, 68, 11, 2189);
    			attr_dev(span10, "class", "icon is-medium");
    			add_location(span10, file$1, 67, 10, 2148);
    			attr_dev(button2, "class", "button is-rounded");
    			add_location(button2, file$1, 66, 9, 2103);
    			attr_dev(div8, "class", "column has-text-centered");
    			add_location(div8, file$1, 65, 8, 2055);
    			attr_dev(div9, "class", "columns is-mobile is-vcentered is-centered has-no-margin svelte-3nq91f");
    			add_location(div9, file$1, 42, 7, 1379);
    			attr_dev(div10, "class", "column is-half has-text-centered");
    			add_location(div10, file$1, 41, 6, 1325);
    			attr_dev(div11, "class", "columns is-multiline is-vcentered is-centered has-no-margin svelte-3nq91f");
    			add_location(div11, file$1, 32, 5, 1006);
    			attr_dev(div12, "class", "container block");
    			add_location(div12, file$1, 31, 4, 971);
    			attr_dev(nav0, "class", "level line svelte-3nq91f");
    			add_location(nav0, file$1, 76, 4, 2321);
    			attr_dev(p1, "class", "subtitle is-ubuntu has-text-weight-bold is-4 svelte-3nq91f");
    			add_location(p1, file$1, 78, 5, 2405);
    			attr_dev(div13, "class", "container block has-text-centered");
    			add_location(div13, file$1, 77, 4, 2352);
    			attr_dev(div14, "class", "columns is-multiline is-vcentered is-centered has-no-margin svelte-3nq91f");
    			add_location(div14, file$1, 83, 5, 2547);
    			attr_dev(div15, "class", "container block");
    			add_location(div15, file$1, 82, 4, 2512);
    			attr_dev(nav1, "class", "level line svelte-3nq91f");
    			add_location(nav1, file$1, 92, 4, 2744);
    			attr_dev(i5, "class", "fas fa-arrow-right");
    			add_location(i5, file$1, 96, 7, 2923);
    			attr_dev(span11, "class", "icon is-medium has-text-centered");
    			add_location(span11, file$1, 95, 6, 2868);
    			attr_dev(span12, "class", "is-ubuntu svelte-3nq91f");
    			add_location(span12, file$1, 98, 6, 2978);
    			attr_dev(button3, "class", "button is-rounded");
    			add_location(button3, file$1, 94, 5, 2827);
    			attr_dev(div16, "class", "container has-text-centered pb-5");
    			add_location(div16, file$1, 93, 4, 2775);
    			attr_dev(div17, "class", "column is-centered is-vcentered box has-no-padding svelte-3nq91f");
    			add_location(div17, file$1, 8, 3, 187);
    			attr_dev(div18, "class", "column is-10");
    			add_location(div18, file$1, 7, 2, 157);
    			attr_dev(div19, "class", "column");
    			add_location(div19, file$1, 103, 2, 3068);
    			attr_dev(div20, "class", "columns is-mobile");
    			add_location(div20, file$1, 5, 1, 98);
    			attr_dev(div21, "class", "container block");
    			add_location(div21, file$1, 4, 0, 67);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div20);
    			append_dev(div20, div0);
    			append_dev(div20, t0);
    			append_dev(div20, div18);
    			append_dev(div18, div17);
    			append_dev(div17, figure);
    			append_dev(figure, img);
    			append_dev(div17, t1);
    			append_dev(div17, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, p0);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(button0, span0);
    			append_dev(span0, i0);
    			append_dev(button0, t4);
    			append_dev(button0, span1);
    			append_dev(div17, t6);
    			append_dev(div17, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div5);
    			append_dev(div5, span4);
    			append_dev(span4, span2);
    			append_dev(span2, i1);
    			append_dev(span4, t7);
    			append_dev(span4, span3);
    			append_dev(div11, t9);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, button1);
    			append_dev(button1, span5);
    			append_dev(span5, i2);
    			append_dev(div9, t10);
    			append_dev(div9, div7);
    			append_dev(div7, span9);
    			append_dev(span9, span6);
    			append_dev(span6, i3);
    			append_dev(span9, t11);
    			append_dev(span9, span7);
    			append_dev(span9, t13);
    			append_dev(span9, span8);
    			append_dev(div9, t15);
    			append_dev(div9, div8);
    			append_dev(div8, button2);
    			append_dev(button2, span10);
    			append_dev(span10, i4);
    			append_dev(div17, t16);
    			append_dev(div17, nav0);
    			append_dev(div17, t17);
    			append_dev(div17, div13);
    			append_dev(div13, p1);
    			append_dev(div17, t19);
    			append_dev(div17, div15);
    			append_dev(div15, div14);
    			mount_component(ingridient0, div14, null);
    			append_dev(div14, t20);
    			mount_component(ingridient1, div14, null);
    			append_dev(div14, t21);
    			mount_component(ingridient2, div14, null);
    			append_dev(div14, t22);
    			mount_component(ingridient3, div14, null);
    			append_dev(div17, t23);
    			append_dev(div17, nav1);
    			append_dev(div17, t24);
    			append_dev(div17, div16);
    			append_dev(div16, button3);
    			append_dev(button3, span11);
    			append_dev(span11, i5);
    			append_dev(button3, t25);
    			append_dev(button3, span12);
    			append_dev(div20, t27);
    			append_dev(div20, div19);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ingridient0.$$.fragment, local);
    			transition_in(ingridient1.$$.fragment, local);
    			transition_in(ingridient2.$$.fragment, local);
    			transition_in(ingridient3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ingridient0.$$.fragment, local);
    			transition_out(ingridient1.$$.fragment, local);
    			transition_out(ingridient2.$$.fragment, local);
    			transition_out(ingridient3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div21);
    			destroy_component(ingridient0);
    			destroy_component(ingridient1);
    			destroy_component(ingridient2);
    			destroy_component(ingridient3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Receipt', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Receipt> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Ingridient });
    	return [];
    }

    class Receipt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Receipt",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let section1;
    	let div1;
    	let div0;
    	let section0;
    	let p;
    	let t1;
    	let searchbar;
    	let t2;
    	let features;
    	let t3;
    	let receiptlist;
    	let t4;
    	let receipt;
    	let current;
    	searchbar = new SearchBar({ $$inline: true });
    	features = new Features({ $$inline: true });
    	receiptlist = new ReceiptList({ $$inline: true });
    	receipt = new Receipt({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			section1 = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			section0 = element("section");
    			p = element("p");
    			p.textContent = "Receptacle.";
    			t1 = space();
    			create_component(searchbar.$$.fragment);
    			t2 = space();
    			create_component(features.$$.fragment);
    			t3 = space();
    			create_component(receiptlist.$$.fragment);
    			t4 = space();
    			create_component(receipt.$$.fragment);
    			attr_dev(p, "class", "title is-ubuntu has-text-black-ter is-2 has-font-weigth-bold has-letters-spaced svelte-1hsupol");
    			add_location(p, file, 12, 5, 436);
    			attr_dev(section0, "class", "container has-text-centered is-vcentered block");
    			add_location(section0, file, 11, 4, 366);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 10, 3, 338);
    			attr_dev(div1, "class", "hero-body");
    			add_location(div1, file, 9, 2, 311);
    			attr_dev(section1, "class", "hero is-fullheight");
    			add_location(section1, file, 8, 1, 272);
    			add_location(main, file, 7, 0, 264);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section1);
    			append_dev(section1, div1);
    			append_dev(div1, div0);
    			append_dev(div0, section0);
    			append_dev(section0, p);
    			append_dev(div0, t1);
    			mount_component(searchbar, div0, null);
    			append_dev(div0, t2);
    			mount_component(features, div0, null);
    			append_dev(div0, t3);
    			mount_component(receiptlist, div0, null);
    			append_dev(div0, t4);
    			mount_component(receipt, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(features.$$.fragment, local);
    			transition_in(receiptlist.$$.fragment, local);
    			transition_in(receipt.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(features.$$.fragment, local);
    			transition_out(receiptlist.$$.fragment, local);
    			transition_out(receipt.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(searchbar);
    			destroy_component(features);
    			destroy_component(receiptlist);
    			destroy_component(receipt);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		SearchBar,
    		ReceiptList,
    		Features,
    		Receipt,
    		name
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
