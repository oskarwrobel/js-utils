export interface EmitterInterface extends Emitter {}
type Callback = ( ...args: any ) => void;

export default class Emitter {
	private _subscribedEmitters: Map<EmitterInterface, Callback[]> = new Map();
	private _events: Map<string, Callback[]> = new Map();

	on( eventName: string, callback: Callback ): void {
		this.listenTo( this, eventName, callback );
	}

	off( eventName: string, callback: Callback ): void {
		this.stopListening( this, eventName, callback );
	}

	fire( eventName: string, ...args: any[] ): void {
		if ( !this._events.has( eventName ) ) {
			return;
		}

		for ( const callback of this._events.get( eventName ) ) {
			callback( ...args );
		}
	}

	listenTo( emitter: EmitterInterface, eventName: string, callback: Callback ): void {
		if ( !this._subscribedEmitters.has( emitter ) ) {
			this._subscribedEmitters.set( emitter, [] );
		}

		if ( !emitter._events.has( eventName ) ) {
			emitter._events.set( eventName, [] );
		}

		const emitterCallbacks = this._subscribedEmitters.get( emitter );
		const eventCallbacks = emitter._events.get( eventName );

		emitterCallbacks.push( callback );
		eventCallbacks.push( callback );
	}

	stopListening( emitter?: EmitterInterface, eventName?: string, callback?: Callback ): void {
		if ( !this._subscribedEmitters.size || emitter && !this._subscribedEmitters.has( emitter ) ) {
			return;
		}

		if ( eventName && !emitter._events.has( eventName ) ) {
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
		emitterCallbacks.splice( emitterCallbacks.indexOf( callback ), 1 );
		eventCallbacks.splice( eventCallbacks.indexOf( callback ), 1 );

		// Remove callback lists when are empty.
		if ( !emitterCallbacks.length ) {
			this._subscribedEmitters.delete( emitter );
		}

		if ( !eventCallbacks.length ) {
			emitter._events.delete( eventName );
		}
	}
}
