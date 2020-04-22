import { expect } from 'chai';
import sinon from 'sinon';

import Observable, { ObservableInterface } from '../src/observable';
import { EmitterEvent } from '../src/emitter';

describe( 'Observable', () => {
	@Observable class ObservableClass {}
	interface ObservableClass extends ObservableInterface {
		foo: any;
		bar: any;
	}

	let observable: ObservableClass;

	beforeEach( () => {
		observable = new ObservableClass();
	} );

	afterEach( () => {
		observable.stopListening();
	} );

	describe( 'set()', () => {
		it( 'should fire `change:propertyName` event when value of observable property has been set', () => {
			const spy = sinon.spy();

			observable.on( 'change:foo', spy );

			observable.set( 'bar', 'a' );
			sinon.assert.notCalled( spy );

			observable.set( 'foo', 'a' );
			sinon.assert.calledOnce( spy );
			sinon.assert.calledWithExactly( spy, sinon.match.instanceOf( EmitterEvent ), 'a', undefined );

			observable.set( 'foo', 'b' );
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, sinon.match.instanceOf( EmitterEvent ), 'b', 'a' );
		} );

		it( 'should make property observable after first set usage', () => {
			const spy = sinon.spy();

			observable.on( 'change:foo', spy );

			observable.set( 'foo', 'a' );
			sinon.assert.calledOnce( spy );

			observable.foo = 'b';
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, sinon.match.instanceOf( EmitterEvent ), 'b', 'a' );
		} );

		it( 'should not fire an event when value has not changed', () => {
			const spy = sinon.spy();

			observable.set( 'foo', 'a' );

			observable.on( 'change:foo', spy );

			observable.foo = 'a';

			sinon.assert.notCalled( spy );
		} );
	} );

	describe( 'bind()', () => {
		it( 'should execute callback that is bind to single property', () => {
			const spy = sinon.spy();

			observable.bind( spy ).to( observable, 'bar' );
			sinon.assert.calledOnce( spy );
			sinon.assert.calledWithExactly( spy.lastCall, undefined );

			observable.set( 'foo', 'a' );
			sinon.assert.calledOnce( spy ); // Still once.

			observable.set( 'bar', 'b' );
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 'b' );

			observable.bar = 'c';
			sinon.assert.calledThrice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 'c' );
		} );

		it( 'should execute callback that is bind to multiple property', () => {
			const spy = sinon.spy();

			const observableA = new ObservableClass();
			const observableB = new ObservableClass();

			observableA.set( 'foo', 1 );
			observableA.set( 'bar', 2 );
			observableB.set( 'foo', 3 );
			observableB.set( 'bar', 4 );

			observable.bind( spy ).to( observableA, 'foo', observableA, 'bar', observableB, 'foo', observableB, 'bar' );

			sinon.assert.calledOnce( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 1, 2, 3, 4 );

			observableA.foo = 11;
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 11, 2, 3, 4 );

			observableB.bar = 44;
			sinon.assert.calledThrice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 11, 2, 3, 44 );
		} );

		it( 'should allow to bind multiple callbacks to the same observable', () => {
			const observableA = new ObservableClass();
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			observable.bind( spy1 ).to( observableA, 'foo' );
			observable.bind( spy2 ).to( observableA, 'foo' );

			sinon.assert.calledOnce( spy1 );
			sinon.assert.calledWithExactly( spy1, undefined );
			sinon.assert.calledOnce( spy2 );
			sinon.assert.calledWithExactly( spy2, undefined );

			observableA.set( 'foo', 'abc' );

			sinon.assert.calledTwice( spy1 );
			sinon.assert.calledWithExactly( spy1.lastCall, 'abc' );
			sinon.assert.calledTwice( spy2 );
			sinon.assert.calledWithExactly( spy2.lastCall, 'abc' );
		} );

		it( 'should throw an error when source is invalid (single observable)', () => {
			expect( () => {
				observable.bind( () => 'sth' ).to( observable );
			} ).to.throw( Error, 'Invalid source definition.' );
		} );

		it( 'should throw an error when source is invalid (single property)', () => {
			expect( () => {
				observable.bind( () => 'sth' ).to( 'foo' );
			} ).to.throw( Error, 'Invalid source definition.' );
		} );

		it( 'should throw an error when source is invalid (multiple observables)', () => {
			expect( () => {
				observable.bind( () => 'sth' ).to( observable, observable );
			} ).to.throw( Error, 'Invalid source definition.' );
		} );

		it( 'should throw an error when source is invalid (multiple properties)', () => {
			expect( () => {
				observable.bind( () => 'sth' ).to( 'foo', 'bar' );
			} ).to.throw( Error, 'Invalid source definition.' );
		} );
	} );

	describe( 'unbind()', () => {
		it( 'should do nothing when observable has not binding at all', () => {
			expect( () => {
				observable.unbind( () => 'sth' );
			} ).to.not.throw();
		} );

		it( 'should do nothing when provided callback was not bound', () => {
			observable.bind( () => 'some' ).to( observable, 'foo' );

			expect( () => {
				observable.unbind( () => 'sth' );
			} ).to.not.throw();
		} );

		it( 'should throw when try to bind the same callback twice', () => {
			const callback = sinon.spy();

			observable.bind( callback ).to( observable, 'foo' );

			expect( () => {
				observable.bind( callback ).to( observable, 'bar' );
			} ).to.throw( Error, 'Cannot bind the same callback twice.' );
		} );

		it( 'should unbind the given callback', () => {
			const observableA = new ObservableClass();
			const spy = sinon.spy();

			observableA.set( 'foo', 1 );

			observable.bind( spy ).to( observableA, 'foo' );
			sinon.assert.calledOnce( spy );

			observable.unbind( spy );

			observableA.foo = 11;
			sinon.assert.calledOnce( spy ); // Still once.
		} );

		it( 'should unbind the given callback when more than one callback is bound to the same observables', () => {
			const observableA = new ObservableClass();
			const observableB = new ObservableClass();
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			observableA.set( 'foo', 1 );
			observableB.set( 'foo', 2 );

			observable.bind( spy1 ).to( observableA, 'foo', observableB, 'foo' );
			observable.bind( spy2 ).to( observableA, 'foo', observableB, 'foo' );
			sinon.assert.calledOnce( spy1 );
			sinon.assert.calledOnce( spy2 );

			observable.unbind( spy1 );

			observableA.foo = 11;
			sinon.assert.calledOnce( spy1 ); // Still once.
			sinon.assert.calledTwice( spy2 );
			sinon.assert.calledWithExactly( spy2.lastCall, 11, 2 );

			observableB.foo = 22;
			sinon.assert.calledOnce( spy1 ); // Still once.
			sinon.assert.calledThrice( spy2 );
			sinon.assert.calledWithExactly( spy2.lastCall, 11, 22 );
		} );

		it( 'should unbind given callback and do not touch other properties', () => {
			const observableA = new ObservableClass();
			const observableB = new ObservableClass();
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			observableA.set( 'foo', 1 );
			observableA.set( 'bar', 2 );
			observableB.set( 'foo', 3 );
			observableB.set( 'bar', 4 );

			observable.bind( spy1 ).to( observableA, 'foo', observableB, 'foo' );
			observable.bind( spy2 ).to( observableA, 'bar', observableB, 'bar', observableA, 'foo' );
			sinon.assert.calledOnce( spy1 );
			sinon.assert.calledOnce( spy2 );

			observable.unbind( spy1 );

			observableA.foo = 11;
			sinon.assert.calledOnce( spy1 ); // Still once.
			sinon.assert.calledTwice( spy2 );
		} );
	} );
} );
