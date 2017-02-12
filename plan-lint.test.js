
const test = require('ava');
const sinon = require('sinon');

const {lint} = require('./plan-lint');

test('lint', t => {
	const ruleVisitor = {
		start: sinon.spy(),
		implementation: sinon.spy(),
		end: sinon.spy()
	};
	const rule = {
		id: 'test',
		create: () => ruleVisitor
	};

	lint([{
		id: 'a',
		interface: 'a',
		dependencies: []
	}, {
		id: 'b',
		interface: 'b',
		dependencies: []
	}], {
		rules: [rule]
	});

	t.true(ruleVisitor.start.calledOnce);
	t.true(ruleVisitor.end.calledOnce);
	t.is(ruleVisitor.implementation.callCount, 2);
});

test('default rules against missing', t => {
	const a = {
		id: 'a',
		interface: 'a',
		dependencies: ['b']
	};
	const errors = lint([a]);
	t.true(errors.length > 0);
});

test('default rules against empty', t => {
	const errors = lint([], {
		target: 'a'
	});
	t.true(errors.length > 0);
});

test('no-undef', t => {
	const a = {
		id: 'a',
		interface: 'a',
		dependencies: ['b']
	};
	const errors = lint([a], {
		rules: ['no-undef']
	});
	t.true(errors.length > 0);
	t.is(errors[0].ruleId, 'no-undef');
});
