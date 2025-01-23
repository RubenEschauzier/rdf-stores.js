import type * as RDF from '@rdfjs/types';
import type { ITermDictionary } from '../dictionary/ITermDictionary';
import type { IRdfStoreOptions } from '../IRdfStoreOptions';
import { encodeOptionalTerms } from '../OrderUtils';
import type { EncodedQuadTerms, QuadPatternTerms, QuadTerms } from '../PatternTerm';
import { RdfStoreIndexNestedMap } from './RdfStoreIndexNestedMap';
import type { NestedMapActual } from './RdfStoreIndexNestedMap';

export class RdfStoreIndexNestedMapSampling<E, V> extends RdfStoreIndexNestedMap<E, V> {
  protected readonly dictionary: ITermDictionary<E>;
  protected readonly nestedMap: NestedMapActual<E, V>;
  protected readonly protectedCountKey: Symbol = Symbol('_count_');
  protected readonly protectedArrayKey: Symbol = Symbol('_array_');

  public readonly features = {
    quotedTripleFiltering: false,
  };

  public constructor(options: IRdfStoreOptions<E>) {
    super(options);
    this.dictionary = options.dictionary;
    this.nestedMap = new Map();
  }

  public override set(terms: EncodedQuadTerms<E>, value: V): boolean {
    const map0 = this.nestedMap;
    let map1: NestedMapActual<E, V> = <any> map0.get(terms[0]);
    if (!map1) {
      map1 = new Map();
      map1.set(<any> this.protectedCountKey, <any> { count: 0 });
      map0.set(terms[0], map1);
    }

    let map2: NestedMapActual<E, V> = <any> map1.get(terms[1]);
    if (!map2) {
      map2 = new Map();
      map2.set(<any> this.protectedCountKey, <any> { count: 0 });
      map1.set(terms[1], map2);
    }

    let map3: NestedMapActual<E, V> = <any> map2.get(terms[2]);
    if (!map3) {
      map3 = new Map();
      map3.set(<any> this.protectedArrayKey, <any> []);
      map2.set(terms[2], map3);
    }
    const contained = map3.has(terms[3]);
    if (!contained) {
      map3.set(terms[3], value);
      (<E[]> map3.get(<any> this.protectedArrayKey)!).push(terms[3]);
      // New quad requires increment of preceding map counts
      (<ICount> map1.get(<any> this.protectedCountKey)).count++;
      (<ICount> map2.get(<any> this.protectedCountKey)).count++;
    }

    return !contained;
  }

  public override remove(terms: EncodedQuadTerms<E>): boolean {
    const map0 = this.nestedMap;
    const map1: NestedMapActual<E, V> | undefined = <any> map0.get(terms[0]);
    if (!map1) {
      return false;
    }
    const map2: NestedMapActual<E, V> | undefined = <any> map1.get(terms[1]);
    if (!map2) {
      return false;
    }
    const map3: NestedMapActual<E, V> | undefined = <any> map2.get(terms[2]);
    if (!map3) {
      return false;
    }
    const ret = map3.delete(terms[3]);
    if (ret){
      (<ICount> map1.get(<any> this.protectedCountKey)).count--;
      (<ICount> map2.get(<any> this.protectedCountKey)).count--;
      const arrayIndex = (<E[]> map3.get(<any> this.protectedArrayKey));
      const elementIndex = arrayIndex.indexOf(terms[3]);
      // TODO: Validate speed of these two approaches
      arrayIndex[elementIndex] = arrayIndex[arrayIndex.length -1];  // Copy last element to index
      arrayIndex.pop(); 
      // When order matters (not in place)
      // const updatedArray = arrayIndex.splice(elementIndex, 1);
      // map3.set(<any> this.protectedArrayKey, <any> updatedArray);
    }
    // Clean up intermediate maps, empty maps will always have either a
    // size attribute or array attribute so we use === 1 to validate emptiness
    if (ret && map3.size === 1) {
      map2.delete(terms[2]);
      if (map2.size === 1) {
        map1.delete(terms[1]);
        if (map1.size === 1) {
          map0.delete(terms[0]);
        }
      }
    }
    return ret;
  }
  public override * find(terms: QuadPatternTerms): IterableIterator<QuadTerms> {
    const ids = encodeOptionalTerms(terms, this.dictionary);
    if (!ids) {
      return;
    }

    const [ id0, id1, id2, id3 ] = ids;
    const [ term0, term1, term2, term3 ] = terms;

    let partialQuad0: RDF.Term;
    let partialQuad1: RDF.Term;
    let partialQuad2: RDF.Term;
    let partialQuad3: RDF.Term;

    let map1: NestedMapActual<E, V>;
    let map2: NestedMapActual<E, V>;
    let map3: NestedMapActual<E, V>;

    const map0: NestedMapActual<E, V> = this.nestedMap;
    const map0Keys = id0 !== undefined ? (map0.has(id0) ? [ id0 ] : []) : map0.keys();
    for (const key1 of map0Keys) {
      if (key1 === this.protectedArrayKey || key1 === this.protectedCountKey){
        continue;
      }
      map1 = <any>map0.get(key1);
      partialQuad0 = term0 || this.dictionary.decode(key1);
      const map1Keys = id1 !== undefined ? (map1.has(id1) ? [ id1 ] : []) : map1.keys();
      for (const key2 of map1Keys) {
        if (key2 === this.protectedArrayKey || key2 === this.protectedCountKey){
          continue;
        }
        map2 = <any>map1.get(key2);
        partialQuad1 = term1 || this.dictionary.decode(key2);
        const map2Keys = id2 !== undefined ? (map2.has(id2) ? [ id2 ] : []) : map2.keys();
        for (const key3 of map2Keys) {
          if (key3 === this.protectedArrayKey || key3 === this.protectedCountKey){
            continue;
          }    
          map3 = <any>map2.get(key3);
          partialQuad2 = term2 || this.dictionary.decode(key3);
          const map3Keys = id3 !== undefined ? (map3.has(id3) ? [ id3 ] : []) : map3.keys();
          for (const key4 of map3Keys) {
            if (key4 === this.protectedArrayKey || key4 === this.protectedCountKey){
              continue;
            }      
            partialQuad3 = term3 || this.dictionary.decode(key4);
            yield <any>[ partialQuad0, partialQuad1, partialQuad2, partialQuad3 ];
          }
        }
      }
    }
  }

  public override * findEncoded(
    ids: EncodedQuadTerms<E | undefined>,
    terms: QuadPatternTerms,
  ): IterableIterator<EncodedQuadTerms<E>> {
    const [ id0, id1, id2, id3 ] = ids;

    let map1: NestedMapActual<E, V>;
    let map2: NestedMapActual<E, V>;
    let map3: NestedMapActual<E, V>;

    const map0: NestedMapActual<E, V> = this.nestedMap;
    const map0Keys = id0 !== undefined ? (map0.has(id0) ? [ id0 ] : []) : map0.keys();
    for (const key1 of map0Keys) {
      if (key1 === this.protectedArrayKey || key1 === this.protectedCountKey){
        continue;
      }
      map1 = <any>map0.get(key1);
      const map1Keys = id1 !== undefined ? (map1.has(id1) ? [ id1 ] : []) : map1.keys();
      for (const key2 of map1Keys) {
        if (key2 === this.protectedArrayKey || key2 === this.protectedCountKey){
          continue;
        }  
        map2 = <any>map1.get(key2);
        const map2Keys = id2 !== undefined ? (map2.has(id2) ? [ id2 ] : []) : map2.keys();
        for (const key3 of map2Keys) {
          if (key3 === this.protectedArrayKey || key3 === this.protectedCountKey){
            continue;
          }    
          map3 = <any>map2.get(key3);
          const map3Keys = id3 !== undefined ? (map3.has(id3) ? [ id3 ] : []) : map3.keys();
          for (const key4 of map3Keys) {
            if (key4 === this.protectedArrayKey || key4 === this.protectedCountKey){
              continue;
            }      
            yield [ <E> key1, <E> key2, <E> key3, <E> key4 ];
          }
        }
      }
    }
  }    
      
  public override count(terms: QuadPatternTerms): number {
    let count = 0;

    const ids = encodeOptionalTerms(terms, this.dictionary);
    if (!ids) {
      return 0;
    }
    const id0 = ids[0];
    const id1 = ids[1];
    const id2 = ids[2];
    const id3 = ids[3];

    let map1: NestedMapActual<E, V>;
    let map2: NestedMapActual<E, V>;
    let map3: NestedMapActual<E, V>;

    const map0: NestedMapActual<E, V> = this.nestedMap;
    const map0Keys = id0 !== undefined ? (map0.has(id0) ? [ id0 ] : []) : map0.keys();
    for (const key1 of map0Keys) {
      if (key1 !== this.protectedArrayKey && key1 !== this.protectedCountKey){
        map1 = <any>map0.get(key1);
        const map1Keys = id1 !== undefined ? (map1.has(id1) ? [ id1 ] : []) : map1.keys();
        for (const key2 of map1Keys) {
          if (key2 !== this.protectedArrayKey && key2 !== this.protectedCountKey){
            map2 = <any>map1.get(key2);
            const map2Keys = id2 !== undefined ? (map2.has(id2) ? [ id2 ] : []) : map2.keys();
            for (const key3 of map2Keys) {
              if (key3 !== this.protectedArrayKey && key3 !== this.protectedCountKey){
                map3 = <any>map2.get(key3);
                if (id3 !== undefined) {
                  if (map3.has(id3)) {
                    count++;
                  }
                } else {
                  // Reduce by one to ensure the _array_ property isnt counted
                  count += map3.size - 1;
                }
              }
            }
          }
        }  
      }
    }
    return count;
  }

  /**
   * Extracts triple patterns at given indexes. In GSPO index, if terms = [g0, s0, undefined, undefined]
   * indexes = [1, 5] and index = g0: {s0:{ p1: [o1, o2], p2: [o3, o4], p3: [o5, o6] } } it will return (s0 p1 o2), (s0 p3 o6).
   * Note that the indexes values should be lower than the number of triples existing at the non-undefined terms.
   * So for terms [g0, s0, p1, undefined] indexes [1,5] would return nothing as # triples for the term = 2
   * @param terms
   * @param n
   * @param indexes
   * @returns
   */
  public * sample(terms: QuadPatternTerms, indexes: number[]): IterableIterator<QuadTerms> {
    console.log(`Terms: ${JSON.stringify(terms)}`)
    const ids = encodeOptionalTerms(terms, this.dictionary);
    if (!ids) {
      return;
    }
    // TODO: If all are defined just do a lookup with normal function or say you're not allowed that
    const [ id0, id1, id2, id3 ] = ids;

    for (const index of indexes) {
      // The search index taking into account how many triples we've skipped during traversal of index
      let searchIndex = 0;

      const map0: NestedMapActual<E, V> = this.nestedMap;
      if (id0 !== undefined && !map0.has(id0)) {
        return;
      }
      const searchResultMap0 = this.searchMap(id0, map0, searchIndex, index);
      searchIndex = searchResultMap0.searchIndex;
      const map1: NestedMapActual<E, V> = <any> map0.get(searchResultMap0.key);
      if (id1 !== undefined && !map1.has(id1)) {
        return;
      }
      const searchResultMap1 = this.searchMap(id1, map1, searchIndex, index);
      searchIndex = searchResultMap1.searchIndex;

      const map2: NestedMapActual<E, V> = <any> map1.get(searchResultMap1.key);
      if (id2 !== undefined) {
        if (!map2.has(id2)){
          return;
        }
        if (index >= (<NestedMapActual<E,V>> map2.get(id2)!).size - 1){
          throw new Error('Invalid index encountered')
          return;
        }
        const termArray = <E[]>(<NestedMapActual<E,V>> map2.get(id2)!).get(<any> this.protectedArrayKey);
        yield <any> [ searchResultMap0.key, searchResultMap1.key, id2, termArray[index] ];
      }
      else{
        for (const key2 of map2.keys()) {
          if (key2 !== this.protectedArrayKey && key2 !== this.protectedCountKey) {
            const size = (<NestedMapActual<E, V>>map2.get(key2)).size - 1;
            searchIndex += size;
            if (searchIndex > index) {
              searchIndex -= size;
              const termArray = <E[]> (<NestedMapActual<E, V>>map2.get(key2)).get(<any> this.protectedArrayKey);
              // Find correct index within the array
              const tripleIndex = index - (searchIndex);
              yield <any> [ searchResultMap0.key, searchResultMap1.key, key2, termArray[tripleIndex] ];
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Function searching the key in a given map that contains the triple at a given index. Returns
   * the value of the searchIndex and the key where the result will be located. This assumes that
   * any key not undefined exists in the map.
   * @param id
   * @param map
   * @param searchIndex
   * @param index
   * @returns the key of the map where the triple at index is located, and the incremented search index
   */
  private searchMap(id: E | undefined, map: NestedMapActual<E, V>,
    searchIndex: number, index: number): IMapSearchResult<E> {
    // If we're here there is a match in the map for id0
    const mapKeys = [ ...(id !== undefined ? [ id ] : map.keys()) ];
    let key;
    if (mapKeys.length > 1) {
      for (const key1 of mapKeys) {
        if (key1 !== this.protectedArrayKey && key1 !== this.protectedCountKey) {
          const nTriplesInMap = (<ICount> (<NestedMapActual<E, V>>map.get(key1)).get(<any> this.protectedCountKey)).count;
          searchIndex += nTriplesInMap;
          if (searchIndex > index) {
            // Go back one step
            searchIndex -= nTriplesInMap;
            key = key1;
            break;
          }
        }
      }
      if (key === undefined) {
        // Error here for easy debugging, however we can also just return if this were to be actually put to use.
        throw new Error('Tried to sample an index which is higher than the number of triples in store.');
      }
    } else {
      // Take first element, which either means there is only one key or id0 is not undefined. In both cases
      // we don't have to do a search.
      key = mapKeys[0];
    }
    return { key, searchIndex };
  }
}

export interface ICount{
  count: number;
}

export interface IMapSearchResult<E>{
  key: E;
  searchIndex: number;
}

