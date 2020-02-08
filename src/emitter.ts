export type Callback = ( arg0: EmitterEvent, ...args: any ) => void;
type Spy = { (): void; isCalled: boolean };

/**
 * Injects Events emitter API into its host.
 *
 * @mixin
 */
export default class Emitter {
	/**
	 * Map of emitters with register callbacks that are subscribed by this instance.
	 * Used to recognize which callback was registered by this instance.
	 */
	private _subscribedEmitters: Map<Emitter, Callback[]>;

	/**
	 * Map of events and all registered callbacks under this event.
	 */
	private _events: Map<string, Callback[]>;

	/**
	 * Registers a callback function to be executed when an event is fired.
	 *
	 * @param eventName Name of event.
	 * @param callback Function executed when event is fired.
	 */
	on( eventName: string, callback: Callback ): void {
		this.listenTo( this, eventName, callback );
	}

	/**
	 * Stops executing the callback on the given event.
	 *
	 * @param eventName Name of event.
	 * @param callback Function to stop being called.
	 */
	off( eventName: string, callback: Callback ): void {
		this.stopListening( this, eventName, callback );
	}

	/**
	 * Fires an event, executing all callbacks registered for it.
	 *
	 * @param eventName Name of event.
	 * @param args Additional arguments passed to the callback.
	 */
	fire( eventName: string, ...args: any[] ): void {
		if ( !this._events || !this._events.has( eventName ) ) {
			return;
		}

		const callbacks: Callback[] = this._events.get( eventName );

		for ( const callback of Array.from( callbacks ) ) {
			const event = new EmitterEvent( eventName );

			callback( event, ...args );

			if ( event.off.isCalled ) {
				removeCallback( callbacks, callback );
			}

			if ( event.stop.isCalled ) {
				return;
			}
		}
	}

	/**
	 * Registers a callback function to be executed when the given emitter fires an event.
	 *
	 * @param emitter Object that fires event.
	 * @param eventName Name of event.
	 * @param callback Function executed when event is fired.
	 */
	listenTo( emitter: Emitter, eventName: string, callback: Callback ): void {
		if ( !this._subscribedEmitters ) {
			this._subscribedEmitters = new Map();
		}

		if ( !this._subscribedEmitters.has( emitter ) ) {
			this._subscribedEmitters.set( emitter, [] );
		}

		if ( !emitter._events ) {
			emitter._events = new Map();
		}

		if ( !emitter._events.has( eventName ) ) {
			emitter._events.set( eventName, [] );
		}

		const emitterCallbacks = this._subscribedEmitters.get( emitter );
		const eventCallbacks = emitter._events.get( eventName );

		emitterCallbacks.push( callback );
		eventCallbacks.push( callback );
	}

	/**
	 * Stops listening for events.
	 *
	 * @param emitter Emitter to stop listening to.
	 * @param eventName Name of event.
	 * @param callback Function to stop being called.
	 */
	stopListening( emitter?: Emitter, eventName?: string, callback?: Callback ): void {
		if ( !this._subscribedEmitters || !this._subscribedEmitters.size ) {
			return;
		}

		if ( emitter && ( !this._subscribedEmitters || !this._subscribedEmitters.has( emitter ) ) ) {
			return;
		}

		if ( eventName && ( !emitter._events || !emitter._events.has( eventName ) ) ) {
			return;
		}

		if ( !emitter ) {
			for ( const subscribedEmitter of Array.from( this._subscribedEmitters.keys() ) ) {
				this.stopListening( subscribedEmitter );
			}

			return;
		}

		if ( !eventName ) {
			for ( const eventName of Array.from( emitter._events.keys() ) ) {
				this.stopListening( emitter, eventName );
			}

			return;
		}

		if ( !callback ) {
			for ( const callback of Array.from( emitter._events.get( eventName ) ) ) {
				this.stopListening( emitter, eventName, callback );
			}

			return;
		}

		const emitterCallbacks = this._subscribedEmitters.get( emitter );
		const eventCallbacks = emitter._events.get( eventName );

		// Remove callbacks from lists where are registered.
		removeCallback( emitterCallbacks, callback );
		removeCallback( eventCallbacks, callback );

		// Remove callback lists when are empty.
		if ( !emitterCallbacks.length ) {
			this._subscribedEmitters.delete( emitter );
		}

		if ( !eventCallbacks.length ) {
			emitter._events.delete( eventName );
		}
	}
}

/**
 * Event object passed to the each callback executed by the emitter.
 *
 * Provides an API to manipulate the event.
 */
export class EmitterEvent {
	/**
	 * Event name.
	 */
	readonly name: string;

	/**
	 * Prevents from calling further callbacks registered under this event name.
	 */
	stop: Spy;

	/**
	 * Removes the current callback.
	 */
	off: Spy;

	/**
	 * name Event name.
	 */
	constructor( name: string ) {
		this.name = name;
		this.stop = createSpy();
		this.off = createSpy();
	}
}

/**
 * Creates a spy function.
 */
function createSpy(): Spy {
	const spy = function spy(): void {
		spy.isCalled = true;
	};

	spy.isCalled = false;

	return spy;
}

/**
 * Removes callback from callbacks list.
 *
 * @param callbacks List of callbacks.
 * @param callback Callback to remove.
 */
function removeCallback( callbacks: Callback[], callback: Callback ): void {
	callbacks.splice( callbacks.indexOf( callback ), 1 );
}
