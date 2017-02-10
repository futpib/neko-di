
const test = require('ava');
const sinon = require('sinon');

const makedi = require('./di');

const spy = () => sinon.spy(() => ({}));

test.beforeEach(t => {
	t.context.di = makedi();
});

test('totally missing', t => {
	const {di} = t.context;
	t.throws(() => di.require('a'));
});

test('missing', t => {
	const {di} = t.context;

	di.define('a', ['b'], () => {});

	t.throws(() => di.require('a'));
});

test('missing circular', t => {
	const {di} = t.context;

	di.define('a', ['a'], () => {});

	t.throws(() => di.require('a'));
});

test('ok', t => {
	const {di} = t.context;
	const af = spy();

	di.define('a', af);
	const a = di.require('a');

	t.truthy(af.calledOnce);
	t.truthy(af.lastCall.calledWith());
	t.is(a, af.lastCall.returnValue);
});

test('ok 2', t => {
	const {di} = t.context;
	const af = spy();
	const bf = spy();

	di.define('a', ['b'], af);
	di.define('b', bf);
	const a = di.require('a');

	t.truthy(bf.calledOnce);
	t.truthy(bf.lastCall.calledWith());
	t.truthy(af.calledOnce);
	t.truthy(af.lastCall.calledWith(bf.lastCall.returnValue));
	t.is(a, af.lastCall.returnValue);
});

test('ok circular', t => {
	const {di} = t.context;
	const af = spy();
	const b1f = spy();
	const b2f = spy();

	di.define('a', ['b'], af);
	di.define('b', ['b'], b1f);
	di.define('b', b2f);
	const a = di.require('a');

	t.truthy(b2f.calledOnce);
	t.truthy(b2f.lastCall.calledWith());
	t.truthy(b1f.calledOnce);
	t.truthy(b1f.lastCall.calledWith(b2f.lastCall.returnValue));
	t.truthy(af.calledOnce);
	t.truthy(af.lastCall.calledWith(b1f.lastCall.returnValue));
	t.is(a, af.lastCall.returnValue);
});

test('ok circular greedy', t => {
	const {di} = t.context;
	const a1f = spy();
	const a2f = spy();
	const a3f = spy();

	di.define('a', ['a'], a1f);
	di.define('a', ['a'], a2f);
	di.define('a', a3f);
	const a = di.require('a');

	t.truthy([
		a1f.lastCall.returnValue,
		a2f.lastCall.returnValue
	].includes(a));
	t.truthy(a1f.calledOnce);
	t.truthy(a1f.lastCall.calledWith(a3f.lastCall.returnValue) ||
			a1f.lastCall.calledWith(a2f.lastCall.returnValue));
	t.truthy(a2f.calledOnce);
	t.truthy(a2f.lastCall.calledWith(a3f.lastCall.returnValue) ||
			a2f.lastCall.calledWith(a1f.lastCall.returnValue));
	t.truthy(a3f.calledOnce);
	t.truthy(a3f.lastCall.calledWith());
});
