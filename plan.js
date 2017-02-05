const R = require('ramda');
const Immutable = require('immutable');

function plan(impls, target, visited) {
	const targetImpls = impls
		.filter(x => x.get('interface') === target)
		.filter(x => !visited.includes(x))
		.toIndexedSeq()
		.sortBy(x => x.get('dependencies').size)
		.reverse();

	const plans = targetImpls
		.flatMap(x => {
			const deps = x.get('dependencies');
			const depImpls = deps.map(dep => {
				return plan(impls, dep, visited.add(x));
			});
			if (!depImpls.every(Boolean)) {
				return [];
			}
			return [x.set('dependencies', depImpls)];
		});

	return plans.first();
}

function toJS(x) {
	return (x && x.toJS) ? x.toJS() : x;
}

module.exports = {
	plan: R.curry((implementations, target) => {
		implementations = (new Immutable.Seq.Set(implementations))
			.map(x => {
				const pick = [
					'id',
					'interface',
					'dependencies'
				];
				const defaults = {
					dependencies: []
				};
				return (new Immutable.Map())
					.merge(defaults, R.pick(pick, x));
			});
		const visited = new Immutable.Set();
		return toJS(plan(implementations, target, visited));
	})
};
