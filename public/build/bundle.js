
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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
    const file$c = "src/components/SearchBar.svelte";

    function create_fragment$c(ctx) {
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
    			add_location(div0, file$c, 8, 2, 138);
    			attr_dev(input, "class", "input is-rounded is-ubuntu svelte-4dpj9z");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search for recipes...");
    			add_location(input, file$c, 11, 4, 234);
    			attr_dev(i, "class", "fas fa-search has-text-black-ter svelte-4dpj9z");
    			add_location(i, file$c, 17, 5, 408);
    			attr_dev(span, "class", "icon is-right");
    			add_location(span, file$c, 16, 4, 350);
    			attr_dev(div1, "class", "control has-icons-right");
    			add_location(div1, file$c, 10, 3, 192);
    			attr_dev(div2, "class", "column");
    			add_location(div2, file$c, 9, 2, 168);
    			attr_dev(div3, "class", "column is-3");
    			add_location(div3, file$c, 21, 2, 488);
    			attr_dev(div4, "class", "columns");
    			add_location(div4, file$c, 7, 1, 114);
    			attr_dev(div5, "class", "container block");
    			add_location(div5, file$c, 6, 0, 83);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleSearch() {
    	
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/components/mini_components/ButtonIcon.svelte generated by Svelte v3.44.0 */

    const file$b = "src/components/mini_components/ButtonIcon.svelte";

    // (8:1) {#if (icon_right && label != "")}
    function create_if_block_1$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$b, 8, 2, 244);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(8:1) {#if (icon_right && label != \\\"\\\")}",
    		ctx
    	});

    	return block;
    }

    // (14:1) {#if (!icon_right && label != "")}
    function create_if_block$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$b, 14, 2, 440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:1) {#if (!icon_right && label != \\\"\\\")}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let button;
    	let t0;
    	let span;
    	let i;
    	let i_class_value;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon_right*/ ctx[3] && /*label*/ ctx[2] != "" && create_if_block_1$1(ctx);
    	let if_block1 = !/*icon_right*/ ctx[3] && /*label*/ ctx[2] != "" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			i = element("i");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(i, "class", i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]));
    			add_location(i, file$b, 11, 2, 341);
    			attr_dev(span, "class", "icon is-medium has-text-centered");
    			add_location(span, file$b, 10, 1, 291);
    			attr_dev(button, "class", "button is-rounded is-vcentered is-centered");
    			add_location(button, file$b, 6, 0, 124);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, span);
    			append_dev(span, i);
    			append_dev(button, t1);
    			if (if_block1) if_block1.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*handleClick*/ ctx[4])) /*handleClick*/ ctx[4].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*icon_right*/ ctx[3] && /*label*/ ctx[2] != "") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*is_icon_full, icon*/ 3 && i_class_value !== (i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (!/*icon_right*/ ctx[3] && /*label*/ ctx[2] != "") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ButtonIcon', slots, []);
    	let { icon, is_icon_full = true, label = "", icon_right = false } = $$props;
    	let { handleClick = null } = $$props;
    	const writable_props = ['icon', 'is_icon_full', 'label', 'icon_right', 'handleClick'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ButtonIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    		if ('handleClick' in $$props) $$invalidate(4, handleClick = $$props.handleClick);
    	};

    	$$self.$capture_state = () => ({
    		icon,
    		is_icon_full,
    		label,
    		icon_right,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    		if ('handleClick' in $$props) $$invalidate(4, handleClick = $$props.handleClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [icon, is_icon_full, label, icon_right, handleClick];
    }

    class ButtonIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			icon: 0,
    			is_icon_full: 1,
    			label: 2,
    			icon_right: 3,
    			handleClick: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonIcon",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !('icon' in props)) {
    			console.warn("<ButtonIcon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_icon_full() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_icon_full(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon_right() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon_right(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClick() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleClick(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/components/list_page/ListedReceipt.svelte generated by Svelte v3.44.0 */
    const file$a = "src/components/list_page/ListedReceipt.svelte";

    function create_fragment$a(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let p0;
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let t4;
    	let div2;
    	let buttonicon;
    	let div4_transition;
    	let current;

    	buttonicon = new ButtonIcon({
    			props: {
    				icon: "fa-bookmark",
    				is_icon_full: /*is_added_to_bookmarks*/ ctx[3],
    				handleClick: /*func*/ ctx[7]
    			},
    			$$inline: true
    		});

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
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(/*subtitle*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			create_component(buttonicon.$$.fragment);
    			attr_dev(img, "alt", /*title*/ ctx[0]);
    			attr_dev(img, "class", "has-border-left-radius-special has-max-height-card-image svelte-11otswf");
    			if (!src_url_equal(img.src, img_src_value = /*image_src*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$a, 31, 4, 738);
    			attr_dev(figure, "class", "image has-fit-cover svelte-11otswf");
    			add_location(figure, file$a, 30, 3, 697);
    			attr_dev(div0, "class", "column is-4 has-no-padding svelte-11otswf");
    			add_location(div0, file$a, 29, 2, 653);
    			attr_dev(p0, "class", "subtitle is-4 has-text-weight-bold");
    			add_location(p0, file$a, 39, 3, 944);
    			attr_dev(p1, "class", "subtitle is-ubuntu is-6");
    			add_location(p1, file$a, 40, 3, 1006);
    			attr_dev(div1, "class", "column is-4 has-no-padding has-text-centered svelte-11otswf");
    			add_location(div1, file$a, 38, 2, 882);
    			attr_dev(div2, "class", "column is-4 has-no-padding has-text-centered svelte-11otswf");
    			add_location(div2, file$a, 42, 2, 1067);
    			attr_dev(div3, "class", "columns is-mobile is-vcentered has-box-sizing-for-image has-no-margin svelte-11otswf");
    			add_location(div3, file$a, 26, 1, 563);
    			attr_dev(div4, "class", "box container has-no-padding block svelte-11otswf");
    			add_location(div4, file$a, 25, 0, 497);
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
    			append_dev(p0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(p1, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(buttonicon, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) {
    				attr_dev(img, "alt", /*title*/ ctx[0]);
    			}

    			if (!current || dirty & /*image_src*/ 4 && !src_url_equal(img.src, img_src_value = /*image_src*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    			if (!current || dirty & /*subtitle*/ 2) set_data_dev(t3, /*subtitle*/ ctx[1]);
    			const buttonicon_changes = {};
    			if (dirty & /*is_added_to_bookmarks*/ 8) buttonicon_changes.is_icon_full = /*is_added_to_bookmarks*/ ctx[3];
    			buttonicon.$set(buttonicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, {}, true);
    				div4_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon.$$.fragment, local);
    			if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, {}, false);
    			div4_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(buttonicon);
    			if (detaching && div4_transition) div4_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ListedReceipt', slots, []);
    	let { id, title, subtitle, image_src } = $$props;
    	let { bookmarks } = $$props;
    	let is_added_to_bookmarks;
    	const dispatcher = createEventDispatcher();

    	const handleAddRemove = () => {
    		$$invalidate(3, is_added_to_bookmarks = !is_added_to_bookmarks);
    		dispatcher("addRemove", { add_remove: is_added_to_bookmarks, id });
    	};

    	const writable_props = ['id', 'title', 'subtitle', 'image_src', 'bookmarks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListedReceipt> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleAddRemove();

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(5, id = $$props.id);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
    		if ('image_src' in $$props) $$invalidate(2, image_src = $$props.image_src);
    		if ('bookmarks' in $$props) $$invalidate(6, bookmarks = $$props.bookmarks);
    	};

    	$$self.$capture_state = () => ({
    		ButtonIcon,
    		fade,
    		createEventDispatcher,
    		id,
    		title,
    		subtitle,
    		image_src,
    		bookmarks,
    		is_added_to_bookmarks,
    		dispatcher,
    		handleAddRemove
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(5, id = $$props.id);
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate(1, subtitle = $$props.subtitle);
    		if ('image_src' in $$props) $$invalidate(2, image_src = $$props.image_src);
    		if ('bookmarks' in $$props) $$invalidate(6, bookmarks = $$props.bookmarks);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(3, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		title,
    		subtitle,
    		image_src,
    		is_added_to_bookmarks,
    		handleAddRemove,
    		id,
    		bookmarks,
    		func
    	];
    }

    class ListedReceipt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			id: 5,
    			title: 0,
    			subtitle: 1,
    			image_src: 2,
    			bookmarks: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListedReceipt",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[5] === undefined && !('id' in props)) {
    			console.warn("<ListedReceipt> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[0] === undefined && !('title' in props)) {
    			console.warn("<ListedReceipt> was created without expected prop 'title'");
    		}

    		if (/*subtitle*/ ctx[1] === undefined && !('subtitle' in props)) {
    			console.warn("<ListedReceipt> was created without expected prop 'subtitle'");
    		}

    		if (/*image_src*/ ctx[2] === undefined && !('image_src' in props)) {
    			console.warn("<ListedReceipt> was created without expected prop 'image_src'");
    		}

    		if (/*bookmarks*/ ctx[6] === undefined && !('bookmarks' in props)) {
    			console.warn("<ListedReceipt> was created without expected prop 'bookmarks'");
    		}
    	}

    	get id() {
    		throw new Error("<ListedReceipt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ListedReceipt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ListedReceipt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ListedReceipt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<ListedReceipt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<ListedReceipt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image_src() {
    		throw new Error("<ListedReceipt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image_src(value) {
    		throw new Error("<ListedReceipt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bookmarks() {
    		throw new Error("<ListedReceipt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookmarks(value) {
    		throw new Error("<ListedReceipt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/list_page/Pagination.svelte generated by Svelte v3.44.0 */
    const file$9 = "src/components/list_page/Pagination.svelte";

    function create_fragment$9(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let buttonicon0;
    	let t0;
    	let div1;
    	let p;
    	let t1_value = /*page*/ ctx[0] + 1 + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let buttonicon1;
    	let current;

    	buttonicon0 = new ButtonIcon({
    			props: {
    				icon: "fa-chevron-left",
    				label: "Previous",
    				handleClick: /*func*/ ctx[3]
    			},
    			$$inline: true
    		});

    	buttonicon1 = new ButtonIcon({
    			props: {
    				icon: "fa-chevron-right",
    				label: "Next",
    				icon_right: true,
    				handleClick: /*func_1*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(buttonicon0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = text(" / ");
    			t3 = text(/*out_of*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			create_component(buttonicon1.$$.fragment);
    			attr_dev(div0, "class", "column has-text-left");
    			add_location(div0, file$9, 18, 2, 367);
    			attr_dev(p, "class", "subtitle is-ubuntu");
    			add_location(p, file$9, 26, 3, 572);
    			attr_dev(div1, "class", "column has-text-centered");
    			add_location(div1, file$9, 25, 2, 530);
    			attr_dev(div2, "class", "column has-text-right");
    			add_location(div2, file$9, 28, 2, 639);
    			attr_dev(div3, "class", "columns is-vcentered is-mobile");
    			add_location(div3, file$9, 17, 1, 320);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$9, 16, 0, 295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			mount_component(buttonicon0, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(buttonicon1, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*page*/ 1) && t1_value !== (t1_value = /*page*/ ctx[0] + 1 + "")) set_data_dev(t1, t1_value);
    			if (!current || dirty & /*out_of*/ 2) set_data_dev(t3, /*out_of*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon0.$$.fragment, local);
    			transition_in(buttonicon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon0.$$.fragment, local);
    			transition_out(buttonicon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(buttonicon0);
    			destroy_component(buttonicon1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pagination', slots, []);
    	let { page, out_of } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleVariation = x => {
    		dispatcher("variation", { variation: x });
    	};

    	const writable_props = ['page', 'out_of'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleVariation(-1);
    	const func_1 = () => handleVariation(1);

    	$$self.$$set = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('out_of' in $$props) $$invalidate(1, out_of = $$props.out_of);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ButtonIcon,
    		page,
    		out_of,
    		dispatcher,
    		handleVariation
    	});

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('out_of' in $$props) $$invalidate(1, out_of = $$props.out_of);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, out_of, handleVariation, func, func_1];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { page: 0, out_of: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !('page' in props)) {
    			console.warn("<Pagination> was created without expected prop 'page'");
    		}

    		if (/*out_of*/ ctx[1] === undefined && !('out_of' in props)) {
    			console.warn("<Pagination> was created without expected prop 'out_of'");
    		}
    	}

    	get page() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get out_of() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set out_of(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/list_page/ReceiptList.svelte generated by Svelte v3.44.0 */

    const { console: console_1$1 } = globals;
    const file$8 = "src/components/list_page/ReceiptList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (70:3) {#each recipes_showed as receipt}
    function create_each_block$1(ctx) {
    	let listedreceipt;
    	let current;

    	listedreceipt = new ListedReceipt({
    			props: {
    				id: /*receipt*/ ctx[8].id,
    				title: /*receipt*/ ctx[8].title,
    				subtitle: "second",
    				image_src: "https://bulma.io/images/placeholders/256x256.png",
    				bookmarks: /*bookmarks*/ ctx[0]
    			},
    			$$inline: true
    		});

    	listedreceipt.$on("addRemove", /*handleBookmarks*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(listedreceipt.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listedreceipt, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listedreceipt_changes = {};
    			if (dirty & /*recipes_showed*/ 4) listedreceipt_changes.id = /*receipt*/ ctx[8].id;
    			if (dirty & /*recipes_showed*/ 4) listedreceipt_changes.title = /*receipt*/ ctx[8].title;
    			if (dirty & /*bookmarks*/ 1) listedreceipt_changes.bookmarks = /*bookmarks*/ ctx[0];
    			listedreceipt.$set(listedreceipt_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listedreceipt.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listedreceipt.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listedreceipt, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(70:3) {#each recipes_showed as receipt}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t;
    	let pagination;
    	let current;
    	let each_value = /*recipes_showed*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	pagination = new Pagination({
    			props: {
    				page: /*page*/ ctx[1],
    				out_of: /*out_of*/ ctx[3]
    			},
    			$$inline: true
    		});

    	pagination.$on("variation", /*handleVariation*/ ctx[4]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			create_component(pagination.$$.fragment);
    			attr_dev(div0, "class", "column is-two-thirds-tablet");
    			add_location(div0, file$8, 68, 2, 1615);
    			attr_dev(div1, "class", "columns is-centered is-fullwidth");
    			add_location(div1, file$8, 67, 1, 1566);
    			attr_dev(div2, "class", "container block");
    			add_location(div2, file$8, 66, 0, 1535);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t);
    			mount_component(pagination, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*recipes_showed, bookmarks, handleBookmarks*/ 37) {
    				each_value = /*recipes_showed*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const pagination_changes = {};
    			if (dirty & /*page*/ 2) pagination_changes.page = /*page*/ ctx[1];
    			pagination.$set(pagination_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(pagination.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			destroy_component(pagination);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ReceiptList', slots, []);

    	let { recipes = [
    		{
    			id: 1,
    			title: "Pizza",
    			ingredients: [
    				"1 Cup Ingrediente",
    				"2 Cups Ingrediente",
    				"3 Cups Ingrediente",
    				"4 Cups Ingrediente",
    				"5 Cups Ingrediente"
    			],
    			image_receipt: "https://bulma.io/images/placeholders/256x256.png"
    		},
    		{
    			id: 2,
    			title: "Pizza",
    			ingredients: [
    				"1 Cup Ingrediente",
    				"2 Cups Ingrediente",
    				"3 Cups Ingrediente",
    				"4 Cups Ingrediente",
    				"5 Cups Ingrediente"
    			],
    			image_receipt: "https://bulma.io/images/placeholders/256x256.png"
    		}
    	] } = $$props;

    	let { bookmarks } = $$props;
    	let page = 0, out_of = Math.ceil(recipes.length / 5);
    	let recipes_showed = recipes.slice(page * 5, (page + 1) * 5);

    	const handleVariation = event => {
    		$$invalidate(1, page += event.detail.variation);
    		if (page < 0) $$invalidate(1, page = 0);
    		if (page >= out_of - 1) $$invalidate(1, page = out_of - 1);
    		$$invalidate(2, recipes_showed = recipes.slice(page * 5, (page + 1) * 5));
    	};

    	const dispatcher = createEventDispatcher();

    	const handleBookmarks = event => {
    		let receipt_id = event.id;

    		if (event.detail.add_remove) {
    			console.log("adding bookmark");

    			dispatcher("addBookmark", {
    				id: receipt_id,
    				is_added_to_bookmarks: event.detail.add_remove
    			});
    		} else {
    			console.log("removing bookmark");

    			dispatcher("removeBookmark", {
    				id: receipt_id,
    				is_added_to_bookmarks: event.detail.add_remove
    			});
    		}
    	};

    	const writable_props = ['recipes', 'bookmarks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<ReceiptList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('recipes' in $$props) $$invalidate(6, recipes = $$props.recipes);
    		if ('bookmarks' in $$props) $$invalidate(0, bookmarks = $$props.bookmarks);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ListedReceipt,
    		Pagination,
    		recipes,
    		bookmarks,
    		page,
    		out_of,
    		recipes_showed,
    		handleVariation,
    		dispatcher,
    		handleBookmarks
    	});

    	$$self.$inject_state = $$props => {
    		if ('recipes' in $$props) $$invalidate(6, recipes = $$props.recipes);
    		if ('bookmarks' in $$props) $$invalidate(0, bookmarks = $$props.bookmarks);
    		if ('page' in $$props) $$invalidate(1, page = $$props.page);
    		if ('out_of' in $$props) $$invalidate(3, out_of = $$props.out_of);
    		if ('recipes_showed' in $$props) $$invalidate(2, recipes_showed = $$props.recipes_showed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bookmarks,
    		page,
    		recipes_showed,
    		out_of,
    		handleVariation,
    		handleBookmarks,
    		recipes
    	];
    }

    class ReceiptList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { recipes: 6, bookmarks: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReceiptList",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bookmarks*/ ctx[0] === undefined && !('bookmarks' in props)) {
    			console_1$1.warn("<ReceiptList> was created without expected prop 'bookmarks'");
    		}
    	}

    	get recipes() {
    		throw new Error("<ReceiptList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set recipes(value) {
    		throw new Error("<ReceiptList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bookmarks() {
    		throw new Error("<ReceiptList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookmarks(value) {
    		throw new Error("<ReceiptList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Features.svelte generated by Svelte v3.44.0 */
    const file$7 = "src/components/Features.svelte";

    function create_fragment$7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let buttonicon;
    	let current;

    	buttonicon = new ButtonIcon({
    			props: {
    				icon: "fas fa-bookmark",
    				label: "Bookmarks",
    				icon_right: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(buttonicon.$$.fragment);
    			attr_dev(div0, "class", "column has-text-centered");
    			add_location(div0, file$7, 9, 2, 327);
    			attr_dev(div1, "class", "columns is-mobile is-centered is-vcentered");
    			add_location(div1, file$7, 5, 1, 113);
    			attr_dev(div2, "class", "container block");
    			add_location(div2, file$7, 4, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(buttonicon, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(buttonicon);
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Features', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Features> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ButtonIcon });
    	return [];
    }

    class Features extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Features",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/mini_components/TextIcon.svelte generated by Svelte v3.44.0 */

    const file$6 = "src/components/mini_components/TextIcon.svelte";

    // (6:1) {#if label != "" && icon_right}
    function create_if_block_1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$6, 6, 2, 152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(6:1) {#if label != \\\"\\\" && icon_right}",
    		ctx
    	});

    	return block;
    }

    // (14:1) {#if label != "" && !icon_right}
    function create_if_block(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$6, 14, 2, 323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(14:1) {#if label != \\\"\\\" && !icon_right}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let span1;
    	let t0;
    	let span0;
    	let i;
    	let i_class_value;
    	let t1;
    	let if_block0 = /*label*/ ctx[2] != "" && /*icon_right*/ ctx[3] && create_if_block_1(ctx);
    	let if_block1 = /*label*/ ctx[2] != "" && !/*icon_right*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span0 = element("span");
    			i = element("i");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(i, "class", i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]));
    			add_location(i, file$6, 10, 2, 225);
    			attr_dev(span0, "class", "icon");
    			add_location(span0, file$6, 9, 1, 203);
    			attr_dev(span1, "class", "icon-text");
    			add_location(span1, file$6, 4, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			if (if_block0) if_block0.m(span1, null);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span0, i);
    			append_dev(span1, t1);
    			if (if_block1) if_block1.m(span1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[2] != "" && /*icon_right*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(span1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*is_icon_full, icon*/ 3 && i_class_value !== (i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (/*label*/ ctx[2] != "" && !/*icon_right*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(span1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextIcon', slots, []);
    	let { icon, is_icon_full = true, label = "", icon_right = false } = $$props;
    	const writable_props = ['icon', 'is_icon_full', 'label', 'icon_right'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    	};

    	$$self.$capture_state = () => ({ icon, is_icon_full, label, icon_right });

    	$$self.$inject_state = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [icon, is_icon_full, label, icon_right];
    }

    class TextIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			icon: 0,
    			is_icon_full: 1,
    			label: 2,
    			icon_right: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextIcon",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !('icon' in props)) {
    			console.warn("<TextIcon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_icon_full() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_icon_full(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon_right() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon_right(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/receipt_page/Ingredient.svelte generated by Svelte v3.44.0 */
    const file$5 = "src/components/receipt_page/Ingredient.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let texticon;
    	let current;

    	texticon = new TextIcon({
    			props: {
    				icon: "fa-check",
    				label: /*amount*/ ctx[0] + /*ingredient*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(texticon.$$.fragment);
    			attr_dev(div, "class", "column is-half has-text-centered");
    			add_location(div, file$5, 8, 0, 195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(texticon, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const texticon_changes = {};
    			if (dirty & /*amount, ingredient*/ 3) texticon_changes.label = /*amount*/ ctx[0] + /*ingredient*/ ctx[1];
    			texticon.$set(texticon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(texticon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(texticon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(texticon);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ingredient', slots, []);
    	let { ingredient, amount, servings = 4 } = $$props;
    	if (amount != 4 && amount >= 0) amount = amount * servings / 4;
    	const writable_props = ['ingredient', 'amount', 'servings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ingredient> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('ingredient' in $$props) $$invalidate(1, ingredient = $$props.ingredient);
    		if ('amount' in $$props) $$invalidate(0, amount = $$props.amount);
    		if ('servings' in $$props) $$invalidate(2, servings = $$props.servings);
    	};

    	$$self.$capture_state = () => ({ TextIcon, ingredient, amount, servings });

    	$$self.$inject_state = $$props => {
    		if ('ingredient' in $$props) $$invalidate(1, ingredient = $$props.ingredient);
    		if ('amount' in $$props) $$invalidate(0, amount = $$props.amount);
    		if ('servings' in $$props) $$invalidate(2, servings = $$props.servings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [amount, ingredient, servings];
    }

    class Ingredient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { ingredient: 1, amount: 0, servings: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ingredient",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ingredient*/ ctx[1] === undefined && !('ingredient' in props)) {
    			console.warn("<Ingredient> was created without expected prop 'ingredient'");
    		}

    		if (/*amount*/ ctx[0] === undefined && !('amount' in props)) {
    			console.warn("<Ingredient> was created without expected prop 'amount'");
    		}
    	}

    	get ingredient() {
    		throw new Error("<Ingredient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ingredient(value) {
    		throw new Error("<Ingredient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get amount() {
    		throw new Error("<Ingredient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set amount(value) {
    		throw new Error("<Ingredient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get servings() {
    		throw new Error("<Ingredient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set servings(value) {
    		throw new Error("<Ingredient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/receipt_page/IngredientList.svelte generated by Svelte v3.44.0 */
    const file$4 = "src/components/receipt_page/IngredientList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (15:2) {#each ingredients as ingredient, i}
    function create_each_block(ctx) {
    	let ingredient;
    	let current;

    	ingredient = new Ingredient({
    			props: {
    				ingredient: /*ingredient*/ ctx[2],
    				amount: /*amounts*/ ctx[0][/*i*/ ctx[4]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(ingredient.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(ingredient, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const ingredient_changes = {};
    			if (dirty & /*ingredients*/ 2) ingredient_changes.ingredient = /*ingredient*/ ctx[2];
    			if (dirty & /*amounts*/ 1) ingredient_changes.amount = /*amounts*/ ctx[0][/*i*/ ctx[4]];
    			ingredient.$set(ingredient_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ingredient.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ingredient.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ingredient, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(15:2) {#each ingredients as ingredient, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let p;
    	let t1;
    	let div2;
    	let div1;
    	let current;
    	let each_value = /*ingredients*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Recipe Ingridients";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "subtitle is-ubuntu has-text-weight-bold is-4");
    			add_location(p, file$4, 8, 1, 267);
    			attr_dev(div0, "class", "container block has-text-centered");
    			add_location(div0, file$4, 7, 0, 218);
    			attr_dev(div1, "class", "columns is-multiline is-vcentered has-no-margin");
    			add_location(div1, file$4, 13, 1, 389);
    			attr_dev(div2, "class", "container block");
    			add_location(div2, file$4, 12, 0, 358);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ingredients, amounts*/ 3) {
    				each_value = /*ingredients*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('IngredientList', slots, []);
    	let { amounts = ["1", "2", "3", "4", "5"] } = $$props;
    	let { ingredients = ["Ingrediente", "Ingrediente", "Ingrediente", "Ingrediente", "Ingrediente"] } = $$props;
    	const writable_props = ['amounts', 'ingredients'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IngredientList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('amounts' in $$props) $$invalidate(0, amounts = $$props.amounts);
    		if ('ingredients' in $$props) $$invalidate(1, ingredients = $$props.ingredients);
    	};

    	$$self.$capture_state = () => ({ Ingredient, amounts, ingredients });

    	$$self.$inject_state = $$props => {
    		if ('amounts' in $$props) $$invalidate(0, amounts = $$props.amounts);
    		if ('ingredients' in $$props) $$invalidate(1, ingredients = $$props.ingredients);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [amounts, ingredients];
    }

    class IngredientList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { amounts: 0, ingredients: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IngredientList",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get amounts() {
    		throw new Error("<IngredientList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set amounts(value) {
    		throw new Error("<IngredientList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ingredients() {
    		throw new Error("<IngredientList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ingredients(value) {
    		throw new Error("<IngredientList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/receipt_page/TimingAndServings.svelte generated by Svelte v3.44.0 */
    const file$3 = "src/components/receipt_page/TimingAndServings.svelte";

    function create_fragment$3(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let texticon0;
    	let t0;
    	let div5;
    	let div4;
    	let div1;
    	let buttonicon0;
    	let t1;
    	let div2;
    	let texticon1;
    	let t2;
    	let div3;
    	let buttonicon1;
    	let current;

    	texticon0 = new TextIcon({
    			props: {
    				icon: "fa-clock",
    				label: /*time*/ ctx[0] + (/*time*/ ctx[0] === 1 ? ' Minute' : ' Minutes')
    			},
    			$$inline: true
    		});

    	buttonicon0 = new ButtonIcon({
    			props: {
    				icon: "fa-minus",
    				handleClick: /*func*/ ctx[3]
    			},
    			$$inline: true
    		});

    	texticon1 = new TextIcon({
    			props: {
    				icon: "fa-user-friends",
    				label: /*servings*/ ctx[1] + (/*servings*/ ctx[1] === 1 ? ' Serving' : ' Servings')
    			},
    			$$inline: true
    		});

    	buttonicon1 = new ButtonIcon({
    			props: {
    				icon: "fa-plus",
    				handleClick: /*func_1*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			create_component(texticon0.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			create_component(buttonicon0.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(texticon1.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			create_component(buttonicon1.$$.fragment);
    			attr_dev(div0, "class", "column has-text-centered");
    			add_location(div0, file$3, 19, 2, 471);
    			attr_dev(div1, "class", "column has-text-centered");
    			add_location(div1, file$3, 26, 4, 754);
    			attr_dev(div2, "class", "column is-half has-text-centered");
    			add_location(div2, file$3, 30, 4, 886);
    			attr_dev(div3, "class", "column has-text-centered");
    			add_location(div3, file$3, 34, 4, 1055);
    			attr_dev(div4, "class", "columns is-mobile is-vcentered is-centered has-no-margin");
    			add_location(div4, file$3, 23, 3, 671);
    			attr_dev(div5, "class", "column is-two-thirds-tablet has-text-centered");
    			add_location(div5, file$3, 22, 2, 608);
    			attr_dev(div6, "class", "columns is-multiline is-vcentered is-centered has-no-margin");
    			add_location(div6, file$3, 18, 1, 395);
    			attr_dev(div7, "class", "container block");
    			add_location(div7, file$3, 17, 0, 364);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			mount_component(texticon0, div0, null);
    			append_dev(div6, t0);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			mount_component(buttonicon0, div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			mount_component(texticon1, div2, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			mount_component(buttonicon1, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const texticon0_changes = {};
    			if (dirty & /*time*/ 1) texticon0_changes.label = /*time*/ ctx[0] + (/*time*/ ctx[0] === 1 ? ' Minute' : ' Minutes');
    			texticon0.$set(texticon0_changes);
    			const texticon1_changes = {};
    			if (dirty & /*servings*/ 2) texticon1_changes.label = /*servings*/ ctx[1] + (/*servings*/ ctx[1] === 1 ? ' Serving' : ' Servings');
    			texticon1.$set(texticon1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(texticon0.$$.fragment, local);
    			transition_in(buttonicon0.$$.fragment, local);
    			transition_in(texticon1.$$.fragment, local);
    			transition_in(buttonicon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(texticon0.$$.fragment, local);
    			transition_out(buttonicon0.$$.fragment, local);
    			transition_out(texticon1.$$.fragment, local);
    			transition_out(buttonicon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(texticon0);
    			destroy_component(buttonicon0);
    			destroy_component(texticon1);
    			destroy_component(buttonicon1);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TimingAndServings', slots, []);
    	let { time = 60, servings = 4 } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleServings = x => {
    		dispatcher('variation', { variation: x });
    	};

    	const writable_props = ['time', 'servings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimingAndServings> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleServings(-1);
    	const func_1 = () => handleServings(+1);

    	$$self.$$set = $$props => {
    		if ('time' in $$props) $$invalidate(0, time = $$props.time);
    		if ('servings' in $$props) $$invalidate(1, servings = $$props.servings);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ButtonIcon,
    		TextIcon,
    		time,
    		servings,
    		dispatcher,
    		handleServings
    	});

    	$$self.$inject_state = $$props => {
    		if ('time' in $$props) $$invalidate(0, time = $$props.time);
    		if ('servings' in $$props) $$invalidate(1, servings = $$props.servings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [time, servings, handleServings, func, func_1];
    }

    class TimingAndServings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { time: 0, servings: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimingAndServings",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get time() {
    		throw new Error("<TimingAndServings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error("<TimingAndServings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get servings() {
    		throw new Error("<TimingAndServings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set servings(value) {
    		throw new Error("<TimingAndServings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/receipt_page/TitleAndAddBookmark.svelte generated by Svelte v3.44.0 */
    const file$2 = "src/components/receipt_page/TitleAndAddBookmark.svelte";

    function create_fragment$2(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let div1;
    	let buttonicon;
    	let current;

    	buttonicon = new ButtonIcon({
    			props: {
    				icon: "fa-bookmark",
    				is_icon_full: /*is_added_to_bookmarks*/ ctx[0],
    				label: "Add to Bookmarks",
    				handleClick: /*func*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			create_component(buttonicon.$$.fragment);
    			attr_dev(p, "class", "title is-ubuntu");
    			add_location(p, file$2, 21, 3, 526);
    			attr_dev(div0, "class", "column is-half has-text-centered");
    			add_location(div0, file$2, 20, 2, 476);
    			attr_dev(div1, "class", "column is-half has-text-centered");
    			add_location(div1, file$2, 23, 2, 576);
    			attr_dev(div2, "class", "columns is-multiline is-vcentered is-centered");
    			add_location(div2, file$2, 19, 1, 414);
    			attr_dev(div3, "class", "container block");
    			add_location(div3, file$2, 18, 0, 383);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(buttonicon, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);
    			const buttonicon_changes = {};
    			if (dirty & /*is_added_to_bookmarks*/ 1) buttonicon_changes.is_icon_full = /*is_added_to_bookmarks*/ ctx[0];
    			buttonicon.$set(buttonicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(buttonicon);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TitleAndAddBookmark', slots, []);
    	let { title, is_added_to_bookmarks } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleAddRemove = () => {
    		$$invalidate(0, is_added_to_bookmarks = !is_added_to_bookmarks);
    		dispatcher("addRemove", { add_remove: is_added_to_bookmarks });
    	};

    	const writable_props = ['title', 'is_added_to_bookmarks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TitleAndAddBookmark> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleAddRemove();

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ButtonIcon,
    		title,
    		is_added_to_bookmarks,
    		dispatcher,
    		handleAddRemove
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [is_added_to_bookmarks, title, handleAddRemove, func];
    }

    class TitleAndAddBookmark extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 1, is_added_to_bookmarks: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleAndAddBookmark",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<TitleAndAddBookmark> was created without expected prop 'title'");
    		}

    		if (/*is_added_to_bookmarks*/ ctx[0] === undefined && !('is_added_to_bookmarks' in props)) {
    			console.warn("<TitleAndAddBookmark> was created without expected prop 'is_added_to_bookmarks'");
    		}
    	}

    	get title() {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_added_to_bookmarks() {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_added_to_bookmarks(value) {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/receipt_page/Receipt.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/receipt_page/Receipt.svelte";

    function create_fragment$1(ctx) {
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let titleandaddbookmark;
    	let t1;
    	let timingandservings;
    	let t2;
    	let nav0;
    	let t3;
    	let ingridientlist;
    	let t4;
    	let nav1;
    	let t5;
    	let div0;
    	let buttonicon;
    	let current;

    	titleandaddbookmark = new TitleAndAddBookmark({
    			props: {
    				title: /*receipt*/ ctx[1].title,
    				is_added_to_bookmarks: /*is_added_to_bookmarks*/ ctx[0]
    			},
    			$$inline: true
    		});

    	titleandaddbookmark.$on("addRemove", /*handleBookmarks*/ ctx[6]);

    	timingandservings = new TimingAndServings({
    			props: { time: 60, servings: /*servings*/ ctx[2] },
    			$$inline: true
    		});

    	timingandservings.$on("variation", /*handleServings*/ ctx[5]);

    	ingridientlist = new IngredientList({
    			props: {
    				ingredients: /*ingredients*/ ctx[4],
    				amounts: /*amounts*/ ctx[3]
    			},
    			$$inline: true
    		});

    	buttonicon = new ButtonIcon({
    			props: {
    				icon: "fa-hat-chef",
    				label: "How to cook",
    				icon_right: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			create_component(titleandaddbookmark.$$.fragment);
    			t1 = space();
    			create_component(timingandservings.$$.fragment);
    			t2 = space();
    			nav0 = element("nav");
    			t3 = space();
    			create_component(ingridientlist.$$.fragment);
    			t4 = space();
    			nav1 = element("nav");
    			t5 = space();
    			div0 = element("div");
    			create_component(buttonicon.$$.fragment);
    			attr_dev(img, "alt", "immagine ricetta");
    			attr_dev(img, "class", "image-receipt svelte-2pemt8");
    			if (!src_url_equal(img.src, img_src_value = /*receipt*/ ctx[1].image_receipt)) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 44, 5, 1236);
    			attr_dev(figure, "class", "image is-3by2 block");
    			add_location(figure, file$1, 43, 4, 1194);
    			attr_dev(nav0, "class", "level line svelte-2pemt8");
    			add_location(nav0, file$1, 60, 4, 1609);
    			attr_dev(nav1, "class", "level line svelte-2pemt8");
    			add_location(nav1, file$1, 62, 4, 1687);
    			attr_dev(div0, "class", "container has-text-centered pb-5");
    			add_location(div0, file$1, 63, 4, 1718);
    			attr_dev(div1, "class", "column is-centered is-vcentered box has-no-padding svelte-2pemt8");
    			add_location(div1, file$1, 42, 3, 1125);
    			attr_dev(div2, "class", "column is-two-thirds-tablet");
    			add_location(div2, file$1, 41, 2, 1080);
    			attr_dev(div3, "class", "columns is-centered is-vcentered");
    			add_location(div3, file$1, 40, 1, 1031);
    			attr_dev(div4, "class", "container block");
    			add_location(div4, file$1, 39, 0, 1000);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, figure);
    			append_dev(figure, img);
    			append_dev(div1, t0);
    			mount_component(titleandaddbookmark, div1, null);
    			append_dev(div1, t1);
    			mount_component(timingandservings, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, nav0);
    			append_dev(div1, t3);
    			mount_component(ingridientlist, div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, nav1);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			mount_component(buttonicon, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*receipt*/ 2 && !src_url_equal(img.src, img_src_value = /*receipt*/ ctx[1].image_receipt)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			const titleandaddbookmark_changes = {};
    			if (dirty & /*receipt*/ 2) titleandaddbookmark_changes.title = /*receipt*/ ctx[1].title;
    			if (dirty & /*is_added_to_bookmarks*/ 1) titleandaddbookmark_changes.is_added_to_bookmarks = /*is_added_to_bookmarks*/ ctx[0];
    			titleandaddbookmark.$set(titleandaddbookmark_changes);
    			const timingandservings_changes = {};
    			if (dirty & /*servings*/ 4) timingandservings_changes.servings = /*servings*/ ctx[2];
    			timingandservings.$set(timingandservings_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titleandaddbookmark.$$.fragment, local);
    			transition_in(timingandservings.$$.fragment, local);
    			transition_in(ingridientlist.$$.fragment, local);
    			transition_in(buttonicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titleandaddbookmark.$$.fragment, local);
    			transition_out(timingandservings.$$.fragment, local);
    			transition_out(ingridientlist.$$.fragment, local);
    			transition_out(buttonicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(titleandaddbookmark);
    			destroy_component(timingandservings);
    			destroy_component(ingridientlist);
    			destroy_component(buttonicon);
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
    	let { is_added_to_bookmarks } = $$props;
    	let { receipt } = $$props;
    	let amounts, ingredients;
    	let servings = 4; //Non presente nelle API, default 4

    	const handleServings = event => {
    		$$invalidate(2, servings += event.detail.variation);
    		if (servings < 1) $$invalidate(2, servings = 1);
    	};

    	const dispatcher = createEventDispatcher();

    	const handleBookmarks = event => {
    		if (event.detail.add_remove) {
    			console.log("adding bookmark");

    			dispatcher("addBookmark", {
    				id: receipt.id,
    				is_added_to_bookmarks: event.detail.add_remove
    			});
    		} else {
    			console.log("removing bookmark");

    			dispatcher("removeBookmark", {
    				id: receipt.id,
    				is_added_to_bookmarks: event.detail.add_remove
    			});
    		}
    	};

    	const writable_props = ['is_added_to_bookmarks', 'receipt'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Receipt> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    		if ('receipt' in $$props) $$invalidate(1, receipt = $$props.receipt);
    	};

    	$$self.$capture_state = () => ({
    		IngridientList: IngredientList,
    		ButtonIcon,
    		TimingAndServings,
    		TitleAndAddBookmark,
    		createEventDispatcher,
    		is_added_to_bookmarks,
    		receipt,
    		amounts,
    		ingredients,
    		servings,
    		handleServings,
    		dispatcher,
    		handleBookmarks
    	});

    	$$self.$inject_state = $$props => {
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    		if ('receipt' in $$props) $$invalidate(1, receipt = $$props.receipt);
    		if ('amounts' in $$props) $$invalidate(3, amounts = $$props.amounts);
    		if ('ingredients' in $$props) $$invalidate(4, ingredients = $$props.ingredients);
    		if ('servings' in $$props) $$invalidate(2, servings = $$props.servings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		is_added_to_bookmarks,
    		receipt,
    		servings,
    		amounts,
    		ingredients,
    		handleServings,
    		handleBookmarks
    	];
    }

    class Receipt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { is_added_to_bookmarks: 0, receipt: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Receipt",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*is_added_to_bookmarks*/ ctx[0] === undefined && !('is_added_to_bookmarks' in props)) {
    			console_1.warn("<Receipt> was created without expected prop 'is_added_to_bookmarks'");
    		}

    		if (/*receipt*/ ctx[1] === undefined && !('receipt' in props)) {
    			console_1.warn("<Receipt> was created without expected prop 'receipt'");
    		}
    	}

    	get is_added_to_bookmarks() {
    		throw new Error("<Receipt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_added_to_bookmarks(value) {
    		throw new Error("<Receipt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get receipt() {
    		throw new Error("<Receipt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set receipt(value) {
    		throw new Error("<Receipt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const bookmarks_stored = localStorage.getItem('bookmarks');

    const bookmarks_store = writable(JSON.parse(bookmarks_stored.toString()) || JSON.parse('[]'));

    bookmarks_store.subscribe((value) => localStorage.bookmarks = value);

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
    	let receipt_1;
    	let current;
    	searchbar = new SearchBar({ $$inline: true });
    	features = new Features({ $$inline: true });

    	receiptlist = new ReceiptList({
    			props: { bookmarks: /*bookmarks*/ ctx[0] },
    			$$inline: true
    		});

    	receipt_1 = new Receipt({
    			props: {
    				receipt: /*receipt*/ ctx[2],
    				is_added_to_bookmarks: /*is_added_to_bookmarks*/ ctx[1]
    			},
    			$$inline: true
    		});

    	receipt_1.$on("addBookmark", /*addReceiptToBookmarks*/ ctx[3]);
    	receipt_1.$on("removeBookmark", /*removeFromBookmarks*/ ctx[4]);

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
    			create_component(receipt_1.$$.fragment);
    			attr_dev(p, "class", "title is-ubuntu has-text-black is-2 has-font-weigth-bold has-letters-spaced svelte-131p7dq");
    			add_location(p, file, 40, 5, 1343);
    			attr_dev(section0, "class", "container has-text-centered is-vcentered block");
    			add_location(section0, file, 39, 4, 1273);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 38, 3, 1245);
    			attr_dev(div1, "class", "hero-body");
    			add_location(div1, file, 37, 2, 1218);
    			attr_dev(section1, "class", "hero is-fullheight");
    			add_location(section1, file, 36, 1, 1179);
    			add_location(main, file, 35, 0, 1171);
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
    			mount_component(receipt_1, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const receiptlist_changes = {};
    			if (dirty & /*bookmarks*/ 1) receiptlist_changes.bookmarks = /*bookmarks*/ ctx[0];
    			receiptlist.$set(receiptlist_changes);
    			const receipt_1_changes = {};
    			if (dirty & /*is_added_to_bookmarks*/ 2) receipt_1_changes.is_added_to_bookmarks = /*is_added_to_bookmarks*/ ctx[1];
    			receipt_1.$set(receipt_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(features.$$.fragment, local);
    			transition_in(receiptlist.$$.fragment, local);
    			transition_in(receipt_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(features.$$.fragment, local);
    			transition_out(receiptlist.$$.fragment, local);
    			transition_out(receipt_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(searchbar);
    			destroy_component(features);
    			destroy_component(receiptlist);
    			destroy_component(receipt_1);
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

    	let receipt = {
    		id: 1,
    		title: "Pizza",
    		ingredients: [
    			"1 Cup Ingrediente",
    			"2 Cups Ingrediente",
    			"3 Cups Ingrediente",
    			"4 Cups Ingrediente",
    			"5 Cups Ingrediente"
    		],
    		image_receipt: "https://bulma.io/images/placeholders/256x256.png"
    	};

    	let bookmarks;

    	bookmarks_store.subscribe(value => {
    		$$invalidate(0, bookmarks = value);
    	});

    	let is_added_to_bookmarks = bookmarks.includes(receipt.id);

    	const addReceiptToBookmarks = event => {
    		let receipt_id = event.detail.id;
    		bookmarks_store.update($$invalidate(0, bookmarks = bookmarks.push(receipt_id)));
    	};

    	const removeFromBookmarks = event => {
    		let receipt_id = event.detail.id;
    		let index_bookmark = bookmarks.indexOf(receipt_id);
    		bookmarks.splice(index_bookmark, 1);
    		$$invalidate(1, is_added_to_bookmarks = event.detail.is_added_to_bookmarks);
    	};

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(5, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		SearchBar,
    		ReceiptList,
    		Features,
    		Receipt,
    		name,
    		receipt,
    		bookmarks_store,
    		bookmarks,
    		is_added_to_bookmarks,
    		addReceiptToBookmarks,
    		removeFromBookmarks
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(5, name = $$props.name);
    		if ('receipt' in $$props) $$invalidate(2, receipt = $$props.receipt);
    		if ('bookmarks' in $$props) $$invalidate(0, bookmarks = $$props.bookmarks);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(1, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bookmarks,
    		is_added_to_bookmarks,
    		receipt,
    		addReceiptToBookmarks,
    		removeFromBookmarks,
    		name
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[5] === undefined && !('name' in props)) {
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
