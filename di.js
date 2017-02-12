
const sha1 = require('sha1');

const Immutable = require('immutable');

const ExtendableError = require('es6-error');

const {plan} = require('./plan');
const {lint} = require('./plan-lint');

class PlanLintError extends ExtendableError {
	constructor(linterErrors) {
		super();

		this._linterErrors = linterErrors;

		const errorsMessage = JSON.stringify(linterErrors, null, 2);

		this.message = `Linter found following errors: ${errorsMessage}`;
	}
	get linterErrors() {
		return this._linterErrors;
	}
}

class DoesNotComputeError extends ExtendableError {}

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

	_lint(items, options) {
		const errors = lint(items, options);
		if (errors.length === 0) {
			return;
		}
		throw new PlanLintError(errors);
	}

	require(interface_) {
		const items = Array.from(this._idToPlanItem.values());

		this._lint(items, {
			target: interface_
		});

		const planned = plan(items, interface_);

		if (!planned) {
			throw new DoesNotComputeError();
		}

		const factory = planItem => this._idToFactory.get(planItem.id);
		const instantiate = planItem => {
			const depInstances = planItem.dependencies.map(instantiate);
			return factory(planItem).apply(null, depInstances);
		};

		return instantiate(planned);
	}
}

function makedi() {
	return new DependencyInjector();
}

module.exports = Object.assign(makedi, {
	DependencyInjector,
	PlanLintError
});
