import { DataFactory } from 'rdf-data-factory';
import type { ITermDictionary } from '../../lib/dictionary/ITermDictionary';
import { TermDictionaryNumberMap } from '../../lib/dictionary/TermDictionaryNumberMap';
import { TermDictionaryQuotedIndexed } from '../../lib/dictionary/TermDictionaryQuotedIndexed';
import { RdfStoreIndexNestedMapSampling } from '../../lib/index/RdfStoreIndexNestedMapSampling';

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
  });
  it('should construct proper store', () => {
    index.set([
      dictionary.encode(DF.namedNode('g1')),
      dictionary.encode(DF.namedNode('s1')),
      dictionary.encode(DF.namedNode('p1')),
      dictionary.encode(DF.namedNode('o1')),
    ], false);
    index.set([
      dictionary.encode(DF.namedNode('g1')),
      dictionary.encode(DF.namedNode('s1')),
      dictionary.encode(DF.namedNode('p1')),
      dictionary.encode(DF.namedNode('o2')),
    ], true);
    // console.log(index);
  });
  describe('sample', () => {
    beforeEach(() => {
      // Index: s0:{ p1: [o1, o2], p2: [o3, o4], p3: [o5, o6] }
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
    });
    it('should correctly sample', () => {
      const result = [...index.sample( [DF.namedNode('g0'), DF.namedNode('s0'),
        undefined,undefined], [1,5])];
      console.log(result)
    });  
  })
});
