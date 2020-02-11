import sinon from 'sinon';

import Observable from '../src/observable';
import { EmitterEvent } from '../src/emitter';

describe( 'Observable', () => {
	let observable: Observable;

	beforeEach( () => {
		observable = new Observable();
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
	} );

	describe( 'bind()', () => {
		it( 'should execute callback that is bind to single property', () => {
			const spy = sinon.spy();

			observable.bind( spy ).to( observable, 'something' );
			sinon.assert.calledOnce( spy );
			sinon.assert.calledWithExactly( spy.lastCall, undefined );

			observable.set( 'other', 'a' );
			sinon.assert.calledOnce( spy ); // Still once.

			observable.set( 'something', 'foo' );
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 'foo' );

			observable.something = 'bar';
			sinon.assert.calledThrice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 'bar' );
		} );

		it( 'should execute callback that is bind to multiple property', () => {
			const spy = sinon.spy();

			const observableA = new Observable();
			const observableB = new Observable();

			observable.bind( spy ).to( observableA, 'foo', observableB, 'bar' );

			sinon.assert.calledOnce( spy );
			sinon.assert.calledWithExactly( spy.lastCall, undefined, undefined );

			observableA.set( 'foo', 'a' );
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 'a', undefined );

			observableB.set( 'bar', 'b' );
			sinon.assert.calledThrice( spy );
			sinon.assert.calledWithExactly( spy.lastCall, 'a', 'b' );
		} );
	} );
} );
