
const sha1 = require('sha1');

const Immutable = require('immutable');

const {plan} = require('./plan');

class DependencyInjector {
	constructor() {
		this._idToPlanItem = new Immutable.Map();
		this._idToFactory = new Immutable.Map();
	}

	define(...args) {
		const [planItem, factory] = (() => {
			if (args.length === 3) {
				const [interface_, dependencies, factory] = args;
				return [{interface: interface_, dependencies}, factory];
			}
			if (args.length === 2) {
				if (typeof args[0] === 'object') {
					return args;
				}
				const [interface_, factory] = args;
				return [{interface: interface_}, factory];
			}
		})();

		const id = (() => {
			if (planItem.id) {
				return planItem.id;
			}
			const hash = sha1(factory.toString());
			return (new Immutable.Range())
				.map(i => hash + '.' + i)
				.find(id => !this._idToPlanItem.has(id));
		})();
		planItem.id = id;

		this._idToPlanItem = this._idToPlanItem.set(id, planItem);
		this._idToFactory = this._idToFactory.set(id, factory);
	}

	require(interface_) {
		const items = this._idToPlanItem.values();
		const planned = plan(items, interface_);

		const factory = planItem => this._idToFactory.get(planItem.id);
		const instantiate = planItem => {
			const depInstances = planItem.dependencies.map(instantiate);
			return factory(planItem).apply(null, depInstances);
		};

		return instantiate(planned);
	}
}

module.exports = () => new DependencyInjector();
