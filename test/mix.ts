import mix from '../src/mix';
import { expect } from 'chai';

describe( 'utils', () => {
	describe( 'mix', () => {
		class MixinA {
			a(): string {
				return 'a';
			}
		}

		class MixinB {
			b(): string {
				return 'b';
			}
		}

		it( 'should mix 2nd+ argument`s properties into the first class', () => {
			interface Foo extends MixinA, MixinB {}
			class Foo {}
			mix( Foo, MixinA, MixinB );

			expect( Foo ).to.not.have.property( 'a' );
			expect( Foo ).to.not.have.property( 'b' );

			const foo = new Foo();

			expect( foo.a() ).to.equal( 'a' );
			expect( foo.b() ).to.equal( 'b' );
		} );

		it( 'should not change class parent', () => {
			interface Foo extends MixinA {}
			class Foo {}
			mix( Foo, MixinA );

			const foo = new Foo();

			expect( foo ).to.be.instanceof( Foo );
		} );

		it( 'should define properties with the same descriptors as native classes', () => {
			interface Foo extends MixinA {}
			class Foo {
				foo(): string {
					return 'whatever';
				}
			}
			mix( Foo, MixinA );

			const actualDescriptor = Object.getOwnPropertyDescriptor( Foo.prototype, 'a' );
			const expectedDescriptor = Object.getOwnPropertyDescriptor( Foo.prototype, 'foo' );

			expect( actualDescriptor ).to.have.property( 'writable', expectedDescriptor.writable ).to.true;
			expect( actualDescriptor ).to.have.property( 'enumerable', expectedDescriptor.enumerable ).to.false;
			expect( actualDescriptor ).to.have.property( 'configurable', expectedDescriptor.configurable ).to.true;
		} );

		it( 'copies setters and getters (with descriptors as of native classes)', () => {
			class Mixin {
				dataA: string;
				set a( value: string ) {
					this.dataA = value;
				}
				get a(): string {
					return this.dataA;
				}
			}

			interface Foo extends Mixin {}
			class Foo {
				private dataB: string;
				set b( value: string ) {
					this.dataB = value;
				}
				get b(): string {
					return this.dataB;
				}
			}

			mix( Foo, Mixin );

			const actualDescriptor = Object.getOwnPropertyDescriptor( Foo.prototype, 'a' );
			const expectedDescriptor = Object.getOwnPropertyDescriptor( Foo.prototype, 'b' );

			expect( actualDescriptor ).to.have.property( 'enumerable', expectedDescriptor.enumerable ).to.false;
			expect( actualDescriptor ).to.have.property( 'configurable', expectedDescriptor.configurable ).to.true;

			const foo = new Foo();

			foo.a = 'foo';
			expect( foo.dataA ).to.equal( 'foo' );

			foo.dataA = 'bar';
			expect( foo.a ).to.equal( 'bar' );
		} );

		it( 'does not copy already existing properties', () => {
			interface Foo extends MixinA, MixinB {}
			class Foo {
				a(): string {
					return 'foo';
				}
			}
			mix( Foo, MixinA, MixinB );

			const foo = new Foo();

			expect( foo.a() ).to.equal( 'foo' );
			expect( foo.b() ).to.equal( 'b' );
		} );

		it( 'does not copy already existing properties - properties deep in the proto chain', () => {
			class Foo {
				a(): string {
					return 'foo';
				}
			}
			interface Bar extends MixinA, MixinB {}
			class Bar extends Foo {}
			mix( Bar, MixinA, MixinB );

			const bar = new Bar();

			expect( bar.a() ).to.equal( 'foo' );
			expect( bar.b() ).to.equal( 'b' );
		} );
	} );
} );
