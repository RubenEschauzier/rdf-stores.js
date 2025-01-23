import { DataFactory } from 'rdf-data-factory';
import type { ITermDictionary } from '../../lib/dictionary/ITermDictionary';
import { TermDictionaryNumberMap } from '../../lib/dictionary/TermDictionaryNumberMap';
import { TermDictionaryQuotedIndexed } from '../../lib/dictionary/TermDictionaryQuotedIndexed';
import { RdfStoreIndexNestedMapSampling } from '../../lib/index/RdfStoreIndexNestedMapSampling';
import { encodeOptionalTerms } from '../../lib/OrderUtils';

const DF = new DataFactory();

describe('RdfStoreIndexNestedMapSampling', () => {
  let index: RdfStoreIndexNestedMapSampling<number, boolean>;
  let dictionary: ITermDictionary<number>;

  beforeEach(() => {
    dictionary = new TermDictionaryQuotedIndexed(new TermDictionaryNumberMap());
    index = new RdfStoreIndexNestedMapSampling<number, boolean>({
      indexCombinations: [],
      indexConstructor: <any> undefined,
      dictionary,
      dataFactory: new DataFactory(),
    });
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p1')),
      dictionary.encode(DF.namedNode('o1')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p1')),
      dictionary.encode(DF.namedNode('o2')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p2')),
      dictionary.encode(DF.namedNode('o3')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p2')),
      dictionary.encode(DF.namedNode('o4')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p3')),
      dictionary.encode(DF.namedNode('o5')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p3')),
      dictionary.encode(DF.namedNode('o6')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s1')),
      dictionary.encode(DF.namedNode('p3')),
      dictionary.encode(DF.namedNode('o6')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g0')),
      dictionary.encode(DF.namedNode('s1')),
      dictionary.encode(DF.namedNode('p3')),
      dictionary.encode(DF.namedNode('o7')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g1')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p1')),
      dictionary.encode(DF.namedNode('o1')),
    ], true);
    index.set([
      dictionary.encode(DF.namedNode('g1')),
      dictionary.encode(DF.namedNode('s0')),
      dictionary.encode(DF.namedNode('p1')),
      dictionary.encode(DF.namedNode('o2')),
    ], true);
  });
  describe('sample', () => {
    it('should sample all undef', () => {
      const result = [ ...index.sample([ undefined, undefined,
        undefined, undefined ], [ 8 ]) ];
      expect(result).toEqual([[13, 1, 2, 3]])
    });
    it('should sample at index 1 undef', () => {
      const result = [ ...index.sample([ DF.namedNode('g0'), undefined,
        undefined, undefined ], [ 6 ]) ];
      expect(result).toEqual([[0, 11, 8, 10]])
    });
    it('should sample at index 2 undef', () => {
      const result = [ ...index.sample([ DF.namedNode('g0'), DF.namedNode('s0'),
        undefined, undefined ], [ 0, 1 ]) ];
      expect(result).toEqual([[0,1,2,3], [0,1,2,4]]);
    });
    it('should sample at index 3 undef', () => {
      const result = [ ...index.sample([ DF.namedNode('g0'), DF.namedNode('s0'),
        DF.namedNode('p2'), undefined ], [ 0, 1 ]) ];
      expect(result).toEqual([[0,1,5,6], [0,1,5,7]]);
    });
    it('should error when out of bounds', () => {
      const result =index.sample([ DF.namedNode('g0'), DF.namedNode('s0'),
        DF.namedNode('p2'), undefined ], [ 0, 2 ]);
      expect(result.next()).toEqual({"done": false, "value": [0,1,5,6]});
      expect(() => result.next()).toThrow(Error("Invalid index encountered"))}
    );
    it('should return nothing for id not in index', () => {
      const result = [ ...index.sample([ DF.namedNode('g4'), DF.namedNode('s0'),
        DF.namedNode('p2'), undefined ], [ 0, 1 ]) ];
      expect(result).toEqual([]);
    })
    it('should return nothing for id not in first map', () => {
      const result = [ ...index.sample([ DF.namedNode('s0'), DF.namedNode('s0'),
        DF.namedNode('p2'), undefined ], [ 0, 1 ]) ];
      expect(result).toEqual([]);
    })
    it('should return nothing for id not in second map', () => {
      const result = [ ...index.sample([ DF.namedNode('g0'), DF.namedNode('g0'),
        DF.namedNode('p2'), undefined ], [ 0, 1 ]) ];
      expect(result).toEqual([]);
    })
    it('should return nothing for id not in third map', () => {
      const result = [ ...index.sample([ DF.namedNode('g0'), DF.namedNode('s0'),
        DF.namedNode('g0'), undefined ], [ 0, 1 ]) ];
      expect(result).toEqual([]);
    })
  });
  describe('remove', () => {
    it('should remove', () => {
      const removed = index.remove([0,1,2,4]);
      expect(removed).toBeTruthy()
      expect(index.getEncoded([0,1,2,4])).toBeUndefined();
    })
    it('should not remove when it doesnt exist in first map', () => {
      const removed = index.remove([2, 1, 2, 4]);
      expect(removed).toBeFalsy()
    });
    it('should not remove when it doesnt exist in second map', () => {
      const removed = index.remove([0, 5, 2, 4]);
      expect(removed).toBeFalsy()
    });
    it('should not remove when it doesnt exist in third map', () => {
      const removed = index.remove([0, 1, 20, 4]);
      expect(removed).toBeFalsy()
    });
    it('should not remove when it doesnt exist in final map', () => {
      const removed = index.remove([0,1,2,10]);
      expect(removed).toBeFalsy()
    });
    it('should update counts and array index', () => {
      expect(index.remove([0,1,2,3])).toBeTruthy();
      expect([ ...index.sample([ DF.namedNode('g0'), DF.namedNode('s0'),
        undefined, undefined ], [ 0]) ]).toEqual([[0,1,2,4]])
    });
    it('should correctly remove unused maps', () => {
      expect(index.remove([13, 1, 2, 3])).toBeTruthy();
      expect((<any> index).nestedMap.has(13)).toBeTruthy()
      expect(index.remove([13, 1, 2, 4])).toBeTruthy();
      expect((<any> index).nestedMap.has(13)).toBeFalsy()
    });
  });
  describe('count', () => {
    it('should count with all undef', () => {
      expect(index.count([ undefined, undefined,undefined, undefined ]))
        .toEqual(10)
    });
    it('should count with index 1 undef', () => {
      expect(index.count([ DF.namedNode('g0'), undefined,
        undefined, undefined ]))
      .toEqual(8)
    });
    it('should count with index 1 undef', () => {
      expect(index.count([ DF.namedNode('g1'), undefined,
        undefined, undefined ]))
      .toEqual(2)
    });
    it('should count with index 2 undef', () => {
      expect(index.count([ DF.namedNode('g0'), DF.namedNode('s0'),
        undefined, undefined ]))
      .toEqual(6)
    });
    it('should count with index 3 undef', () => {
      expect(index.count([ DF.namedNode('g0'), DF.namedNode('s0'),
        DF.namedNode('p2'), undefined ]))
      .toEqual(2)
    });
    it('should count with no undef', () => {
      expect(index.count([ DF.namedNode('g0'), DF.namedNode('s0'),
        DF.namedNode('p2'), DF.namedNode('o3') ]))
      .toEqual(1)
    });
    it('should count with invalid term', () => {
      expect(index.count([ DF.namedNode('g2'), undefined,
        undefined, undefined ]))
      .toEqual(0)
    });
  });
  describe('find', () => {
    it('should return nothing on invalid term', () => {
      const result = [ ...index.find([ DF.namedNode('g2'), undefined,
        undefined, undefined ]) ];
      expect(result).toEqual([])
    });
    it('should find all undef', () => {
      const result = [ ...index.find([ undefined, undefined,
        undefined, undefined ]) ];
      expect(result).toEqual(numberToTerm([
        [0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 5, 6], [0, 1, 5, 7], [0, 1, 8, 9], 
        [0, 1, 8, 10], [0, 11, 8, 10], [0, 11, 8, 12], [13, 1, 2, 3], [13, 1, 2, 4],
      ], index))
    });
    it('should find at index 1 undef', () => {
      const result = [ ...index.find([ DF.namedNode('g0'), undefined,
        undefined, undefined ])];
      expect(result).toEqual(numberToTerm([[0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 5, 6], [0, 1, 5, 7], 
        [0, 1, 8, 9], [0, 1, 8, 10], [0, 11, 8, 10], [0, 11, 8, 12]], index)
      );
    });
    it('should find at index 2 undef', () => {
      const result = [ ...index.find([ DF.namedNode('g0'), DF.namedNode('s0'),
        undefined, undefined ]) ];
      expect(result).toEqual(numberToTerm([[0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 5, 6], [0, 1, 5, 7], 
        [0, 1, 8, 9], [0, 1, 8, 10]], index));
    });
    it('should find at index 3 undef', () => {
      const result = [ ...index.find([ DF.namedNode('g0'), DF.namedNode('s0'),
        DF.namedNode('p2'), undefined ]) ];
      expect(result).toEqual(numberToTerm([[0,1,5,6], [0,1,5,7]], index));
    });
  });
  describe('findEncoded', () => {
    it('should findEncoded all undef', () => {
      const result = [ ...index.findEncoded([undefined, undefined, undefined, undefined],
        [ undefined, undefined, undefined, undefined ]) ];
      expect(result).toEqual([
        [0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 5, 6], [0, 1, 5, 7], [0, 1, 8, 9], 
        [0, 1, 8, 10], [0, 11, 8, 10], [0, 11, 8, 12], [13, 1, 2, 3], [13, 1, 2, 4],
      ])
    });
    it('should findEncoded at index 1 undef', () => {
      const result = [ ...index.findEncoded([ 0, undefined,
        undefined, undefined ], [ DF.namedNode('g0'), undefined,
        undefined, undefined ])];
      expect(result).toEqual([[0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 5, 6], [0, 1, 5, 7], 
        [0, 1, 8, 9], [0, 1, 8, 10], [0, 11, 8, 10], [0, 11, 8, 12]]
      );
    });
    it('should findEncoded at index 2 undef', () => {
      const result = [ ...index.findEncoded([ 0, 1,
        undefined, undefined ], [ DF.namedNode('g0'), DF.namedNode('s0'),
        undefined, undefined ]) ];
      expect(result).toEqual([[0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 5, 6], [0, 1, 5, 7], 
        [0, 1, 8, 9], [0, 1, 8, 10]]);
    });
    it('should findEncoded at index 3 undef', () => {
      const result = [ ...index.findEncoded([ 0, 1,
        5, undefined ], [ DF.namedNode('g0'), DF.namedNode('s0'),
        DF.namedNode('p2'), undefined ]) ];
      expect(result).toEqual([[0,1,5,6], [0,1,5,7]]);
    });
  });
});

function numberToTerm(terms: [any, any, any, any][], index: any){
  const result: any[] = [];
  for (const term of terms){
    result.push([index.dictionary.decode(term[0]),
    index.dictionary.decode(term[1]),index.dictionary.decode(term[2]),
    index.dictionary.decode(term[3])]);
  }
  return result
}
