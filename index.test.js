
const test = require('ava');

const {permutation} = require('js-combinatorics');

const {plan} = require('.');

test('totally missing', t => {
	const planA = plan([], 'a');
	t.deepEqual(planA, undefined);
});

test('missing', t => {
	const a = {
		id: 'a',
		interface: 'a',
		dependencies: ['b']
	};

	const planA = plan([a], 'a');

	t.deepEqual(planA, undefined);
});

test('missing circular', t => {
	const a = {
		id: 'a',
		interface: 'a',
		dependencies: ['a']
	};

	const planA = plan([a], 'a');

	t.deepEqual(planA, undefined);
});

test('ok', t => {
	const a = {
		id: 'a',
		interface: 'a',
		dependencies: []
	};

	const planA = plan([a], 'a');

	t.deepEqual(planA, a);
});

test('ok 2', t => {
	const a = {
		id: 'a',
		interface: 'a',
		dependencies: ['b']
	};

	const b = {
		id: 'b',
		interface: 'b',
		dependencies: []
	};

	const planB = b;

	const planA = {
		id: 'a',
		interface: 'a',
		dependencies: [planB]
	};

	permutation([a, b]).forEach(p => {
		const f = plan(p);

		t.deepEqual(f('a'), planA);
		t.deepEqual(f('b'), planB);
	});
});

test('ok circular', t => {
	const a = {
		id: 'a',
		interface: 'a',
		dependencies: ['b']
	};

	const b1 = {
		id: 'b1',
		interface: 'b',
		dependencies: ['b']
	};

	const b2 = {
		id: 'b2',
		interface: 'b',
		dependencies: []
	};

	const planB2 = b2;

	const planB1 = {
		id: 'b1',
		interface: 'b',
		dependencies: [planB2]
	};

	const planA = {
		id: 'a',
		interface: 'a',
		dependencies: [planB1]
	};

	permutation([a, b1, b2]).forEach(p => {
		const f = plan(p);

		t.deepEqual(f('a'), planA);
		t.deepEqual(f('b'), planB1);
	});
});

test('ok circular greedy', t => {
	const a1 = {
		id: 'a1',
		interface: 'a',
		dependencies: ['a']
	};

	const a2 = {
		id: 'a2',
		interface: 'a',
		dependencies: ['a']
	};

	const a3 = {
		id: 'a3',
		interface: 'a',
		dependencies: []
	};

	permutation([a1, a2, a3]).forEach(p => {
		const planA = plan(p, 'a');

		t.truthy(['a1', 'a2'].includes(planA.id));
		t.truthy(['a1', 'a2'].includes(planA.dependencies[0].id));
		t.deepEqual(planA.dependencies[0].dependencies[0], a3);
	});
});
