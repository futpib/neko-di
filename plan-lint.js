
const R = require('ramda');

const rules = R.mapObjIndexed((rule, id) => {
	rule.id = id;
	return rule;
}, {
	'no-undef': {
		create(context) {
			const implementedInterfaces = new Set();
			const requiredInterfaceToListOfDependents = new Map();
			return {
				implementation: function (impl) {
					implementedInterfaces.add(impl.interface);
					(impl.dependencies || []).forEach(dep => {
						let dependents;
						if (requiredInterfaceToListOfDependents.has(dep)) {
							dependents = requiredInterfaceToListOfDependents.get(dep);
						} else {
							dependents = new Set();
							requiredInterfaceToListOfDependents.set(dep, dependents);
						}
						dependents.add(impl.interface);
					});
				},
				end: function () {
					R.forEach(([interface_, dependents]) => {
						if (implementedInterfaces.has(interface_)) {
							return;
						}
						context.report({
							message: `${interface_} in not defined`,
							_todo: dependents
						});
					}, Array.from(requiredInterfaceToListOfDependents.entries()));
				}
			};
		}
	},
	'cycles-terminate': {
		create() {
			return 'TODO';
		}
	}
});

function lint(impls, options) {
	options = R.merge({
		target: undefined,
		rules: R.values(rules)
	}, options);

	if (options.target) {
		impls = impls.concat({
			id: Symbol('__target__'),
			interface: Symbol('__target__'),
			dependencies: [options.target]
		});
	}

	const errors = [];

	const context = {
		report: function (err) {
			err.ruleId = this.id;
			errors.push(err);
		}
	};

	const selectedRules = R.map(rule => {
		if (R.is(String, rule)) {
			return rules[rule];
		}
		return rule;
	}, options.rules);

	R.forEach(rule => {
		const ruleVisitor = rule.create(R.merge(context, {
			id: rule.id
		}));
		if (ruleVisitor.start) {
			ruleVisitor.start(impls);
		}
		R.forEach(impl => {
			if (ruleVisitor.implementation) {
				ruleVisitor.implementation(impl);
			}
		}, impls);
		if (ruleVisitor.end) {
			ruleVisitor.end(impls);
		}
	}, selectedRules);

	return errors;
}

module.exports = {
	lint,
	rules
};
