import Emitter, { EmitterInterface } from '../src/emitter';
import { expect } from 'chai';
import sinon from 'sinon';

describe( 'Emitter', () => {
	let emitterA: EmitterInterface, emitterB: EmitterInterface;

	beforeEach( () => {
		emitterA = new Emitter();
		emitterB = new Emitter();
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

			const obj = {};

			emitterA.on( 'something', spy1 );
			emitterA.on( 'something', spy2 );

			emitterA.fire( 'something', obj, 1, 'a', true );

			sinon.assert.calledWithExactly( spy1, obj, 1, 'a', true );
			sinon.assert.calledWithExactly( spy2, obj, 1, 'a', true );
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
} );
