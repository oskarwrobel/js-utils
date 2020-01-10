import uid from '../src/uid';
import { expect } from 'chai';

describe( 'uid', () => {
	it( 'should return different ids', () => {
		const id1 = uid();
		const id2 = uid();
		const id3 = uid();

		expect( id1 ).to.be.a( 'string' );
		expect( id2 ).to.be.a( 'string' ).to.not.equal( id1 ).to.not.equal( id3 );
		expect( id3 ).to.be.a( 'string' ).to.not.equal( id1 ).to.not.equal( id2 );

		const uuidRegex = /^e[a-f0-9]{32}$/;

		expect( id1 ).to.match( uuidRegex );
		expect( id2 ).to.match( uuidRegex );
		expect( id3 ).to.match( uuidRegex );
	} );
} );
