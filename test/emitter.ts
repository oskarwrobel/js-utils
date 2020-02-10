import { expect } from 'chai';
import sinon from 'sinon';

import Emitter, { EmitterEvent } from '../src/emitter';
import mix from '../src/mix';

describe( 'Emitter', () => {
	let emitterA: Emitter, emitterB: Emitter;

	beforeEach( () => {
		emitterA = new Emitter();
		emitterB = new Emitter();
	} );

	afterEach( () => {
		emitterA.stopListening();
		emitterB.stopListening();
	} );

	describe( 'fire()', () => {
		it( 'should execute callbacks', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			emitterA.on( 'something', spy1 );
			emitterA.on( 'something', spy2 );

			emitterA.fire( 'something' );

			sinon.assert.callOrder( spy1, spy2 );
		} );

		it( 'should execute callbacks wit arguments', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();
			const spy3 = sinon.spy();

			const obj = {};

			emitterA.on( 'something', spy1 );
			emitterA.on( 'something', spy2 );
			emitterA.on( 'other', spy3 );

			emitterA.fire( 'something', obj, 1, 'a', true );
			sinon.assert.calledWithExactly( spy1, sinon.match.instanceOf( EmitterEvent ), obj, 1, 'a', true );
			sinon.assert.calledWithExactly( spy2, sinon.match.instanceOf( EmitterEvent ), obj, 1, 'a', true );

			emitterA.fire( 'other' );
			sinon.assert.calledWithExactly( spy3, sinon.match.instanceOf( EmitterEvent ) );
		} );

		it( 'should do nothing for non subscribed event', () => {
			expect( () => {
				emitterA.fire( 'unknown' );
			} ).to.not.throw();
		} );
	} );

	describe( 'listenTo()', () => {
		it( 'should subscribe given event name of a given emitter and register given callback', () => {
			const spy = sinon.spy();

			emitterA.listenTo( emitterB, 'something', spy );

			emitterB.fire( 'something' );
			sinon.assert.calledOnce( spy );
			spy.resetHistory();

			emitterB.fire( 'other' );
			sinon.assert.notCalled( spy );

			emitterA.fire( 'something' );
			sinon.assert.notCalled( spy );
		} );

		it( 'should allow to register more than on callback under the same event name', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			emitterA.listenTo( emitterB, 'something', spy1 );
			emitterA.listenTo( emitterB, 'something', spy2 );

			emitterB.fire( 'something' );
			sinon.assert.calledOnce( spy1 );
			sinon.assert.calledOnce( spy2 );
		} );

		it( 'should prevent from calling further callbacks when `event.stop()` is called', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();
			const spy3 = sinon.spy();

			function customSpy( evt: EmitterEvent ): void {
				evt.stop();
				spy2();
			}

			emitterA.listenTo( emitterB, 'something', spy1 );
			emitterA.listenTo( emitterB, 'something', customSpy );
			emitterA.listenTo( emitterB, 'something', spy3 );

			emitterB.fire( 'something' );

			sinon.assert.calledOnce( spy1 );
			sinon.assert.calledOnce( spy2 );
			sinon.assert.notCalled( spy3 );
		} );

		it( 'should remove callback from registered callbacks', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();
			const spy3 = sinon.spy();

			function customSpy( evt: EmitterEvent ): void {
				evt.off();
				spy2();
			}

			emitterA.listenTo( emitterB, 'something', spy1 );
			emitterA.listenTo( emitterB, 'something', customSpy );
			emitterA.listenTo( emitterB, 'something', spy3 );

			emitterB.fire( 'something' );

			sinon.assert.calledOnce( spy1 );
			sinon.assert.calledOnce( spy2 );
			sinon.assert.calledOnce( spy3 );

			emitterB.fire( 'something' );

			sinon.assert.calledTwice( spy1 );
			sinon.assert.calledOnce( spy2 );
			sinon.assert.calledTwice( spy3 );
		} );
	} );

	describe( 'stopListening()', () => {
		it( 'should unsubscribe given callback', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			emitterA.listenTo( emitterB, 'something', spy1 );
			emitterA.listenTo( emitterB, 'something', spy2 );
			emitterA.listenTo( emitterB, 'other', spy1 );

			emitterA.stopListening( emitterB, 'something', spy1 );

			emitterB.fire( 'something' );
			sinon.assert.notCalled( spy1 );
			sinon.assert.calledOnce( spy2 );

			emitterB.fire( 'other' );
			sinon.assert.calledOnce( spy1 );
		} );

		it( 'should unsubscribe given event name', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			emitterA.listenTo( emitterB, 'something', spy1 );
			emitterA.listenTo( emitterB, 'something', spy2 );
			emitterA.listenTo( emitterB, 'other', spy1 );

			emitterA.stopListening( emitterB, 'something' );

			emitterB.fire( 'something' );
			sinon.assert.notCalled( spy1 );
			sinon.assert.notCalled( spy2 );

			emitterB.fire( 'other' );
			sinon.assert.calledOnce( spy1 );
		} );

		it( 'should unsubscribe given emitter', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			emitterA.listenTo( emitterB, 'something', spy1 );
			emitterA.listenTo( emitterB, 'other', spy1 );
			emitterA.listenTo( emitterA, 'something', spy2 );

			emitterA.stopListening( emitterB );

			emitterB.fire( 'something' );
			sinon.assert.notCalled( spy1 );

			emitterB.fire( 'other' );
			sinon.assert.notCalled( spy1 );

			emitterA.fire( 'something' );
			sinon.assert.calledOnce( spy2 );
		} );

		it( 'should unsubscribe all emitters', () => {
			const spy = sinon.spy();

			emitterA.listenTo( emitterA, 'something', spy );
			emitterA.listenTo( emitterB, 'something', spy );

			emitterA.stopListening();

			emitterA.fire( 'something' );

			sinon.assert.notCalled( spy );
		} );

		it( 'should do nothing when given callback is not subscribed', () => {
			emitterA.listenTo( emitterB, 'something', sinon.spy() );

			expect( () => {
				emitterA.stopListening( emitterB, 'something', sinon.spy() );
			} ).to.not.throw();
		} );

		it( 'should do nothing when given event name is not subscribed', () => {
			emitterA.listenTo( emitterB, 'something', sinon.spy() );

			expect( () => {
				emitterA.stopListening( emitterB, 'other' );
			} ).to.not.throw();
		} );

		it( 'should do nothing when given emitter is not subscribed', () => {
			emitterA.listenTo( emitterB, 'something', sinon.spy() );

			expect( () => {
				emitterA.stopListening( emitterA );
			} ).to.not.throw();
		} );

		it( 'should do nothing when nothing has been subscribed', () => {
			expect( () => {
				emitterA.stopListening();
			} ).to.not.throw();
		} );
	} );

	describe( 'on()', () => {
		it( 'should subscribe self event - alias for `emitter.listenTo( emitter, event, callback )`', () => {
			const spy = sinon.spy();

			emitterA.on( 'something', spy );

			emitterA.fire( 'other' );
			sinon.assert.notCalled( spy );

			emitterA.fire( 'something' );
			sinon.assert.calledOnce( spy );
		} );
	} );

	describe( 'off()', () => {
		it( 'should unsubscribe self event - alias for `emitter.stopListening( emitter, event, callback )`', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			emitterA.on( 'something', spy1 );
			emitterA.on( 'something', spy2 );

			emitterA.off( 'something', spy2 );

			emitterA.fire( 'something' );

			sinon.assert.calledOnce( spy1 );
			sinon.assert.notCalled( spy2 );
		} );
	} );

	describe( 'mixin', () => {
		it( 'should work as a mixin', () => {
			class EmitterHost {}
			interface EmitterHost extends Emitter {}
			mix( EmitterHost, Emitter );

			const spy = sinon.spy();
			const emitterA = new EmitterHost();
			const emitterB = new EmitterHost();

			emitterA.listenTo( emitterB, 'something', spy );

			emitterA.fire( 'something' );

			sinon.assert.notCalled( spy );

			emitterB.fire( 'something' );

			sinon.assert.calledOnce( spy );

			emitterA.stopListening();
			emitterB.stopListening();
		} );
	} );
} );
