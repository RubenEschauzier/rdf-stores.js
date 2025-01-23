import type * as RDF from '@rdfjs/types';
import type { ITermDictionary } from '../dictionary/ITermDictionary';
import type { IRdfStoreOptions } from '../IRdfStoreOptions';
import { encodeOptionalTerms } from '../OrderUtils';
import type { EncodedQuadTerms, QuadPatternTerms, QuadTerms } from '../PatternTerm';
import { RdfStoreIndexNestedMap } from './RdfStoreIndexNestedMap';
import type { NestedMapActual } from './RdfStoreIndexNestedMap';
import { setEngine } from 'crypto';

export class RdfStoreIndexNestedMapSampling<E, V> extends RdfStoreIndexNestedMap<E, V> {
  protected readonly dictionary: ITermDictionary<E>;
  protected readonly nestedMap: NestedMapActual<E, V>;
  protected readonly protectedCountKey: string = "_count_";
  protected readonly protectedArrayKey: string = "_array_";
  
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
      map0.set(terms[0], map1);
    }

    let map2: NestedMapActual<E, V> = <any> map1.get(terms[1]);
    if (!map2) {
      map2 = new Map();
      map1.set(terms[1], map2);
      map1.set(<any> this.protectedCountKey, <any> {count: 0});
    }

    let map3: NestedMapActual<E, V> = <any> map2.get(terms[2]);
    if (!map3) {
      map3 = new Map();
      map2.set(terms[2], map3);
      
      map3.set(<any> '_array_', <any> []);
      map2.set(<any> this.protectedCountKey, <any> {count: 0});
    }
    const contained = map3.has(terms[3]);
    if (!contained) {
      map3.set(terms[3], value);
      (<E[]> map3.get(<any> '_array_')!).push(terms[3]);
      // New quad requires increment of preceding map counts
      (<ICount> map1.get(<any> this.protectedCountKey)).count++;
      (<ICount> map2.get(<any> this.protectedCountKey)).count++;
    }
    // this.printMap(this.nestedMap);
    return !contained;
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
      map1 = <any>map0.get(key1);
      const map1Keys = id1 !== undefined ? (map1.has(id1) ? [ id1 ] : []) : map1.keys();
      for (const key2 of map1Keys) {
        map2 = <any>map1.get(key2);
        const map2Keys = id2 !== undefined ? (map2.has(id2) ? [ id2 ] : []) : map2.keys();
        for (const key3 of map2Keys) {
          map3 = <any>map2.get(key3);
          if (id3 !== undefined) {
            if (map3.has(id3)) {
              count++;
            }
          } else {
            // Reduce by one to ensure the _array_ property isnt counted
            count += map3.size - 1;
            // TODO: Benchmark count performance
            // count += (<E[]> map3.get(<any> this.protectedArrayKey )).length
          }
        }
      }
    }

    return count;
  }
  /**
   * Extracts triple patterns at given indexes. In SPO index, if terms = [g0, s0, undefined, undefined] 
   * indexes = [1, 5] and index = g0: {s0:{ p1: [o1, o2], p2: [o3, o4], p3: [o5, o6] } } it will return (s0 p1 o2), (s0 p3 o6).
   * Note that the indexes values should be lower than the number of triples existing at the non-undefined terms.
   * So for terms [g0, s0, p1, undefined] indexes [1,5] would return nothing as # triples for the term = 2
   * @param terms 
   * @param n 
   * @param indexes 
   * @returns 
   */
  public * sample(terms: QuadPatternTerms, indexes: number[]): IterableIterator<QuadTerms> {
    const ids = encodeOptionalTerms(terms, this.dictionary);
    if (!ids) {
      return;
    }
    const [ id0, id1, id2, id3 ] = ids;
    // const counts = this.constructCounts(ids);
    let searchIndex = 0;

    for (const index of indexes) {
        // The search index taking into account how many triples we've skipped during traversal of index
        let searchIndex = 0;
        // Traverse the maps here. For each id0 that is undefined, we do the same procedure as below
        // and traverse to a lower layer for the value that makes our searchIndex bigger than the count
        // found in the index datastruct. Take care to know that when you pass by a value in a layer that this
        // is not reflected in the count found in a lower layer, that is just the absolute # of triples and not
        // the relative compared to what you have traversed.

        const map0: NestedMapActual<E, V> = this.nestedMap;
        if (id0 !== undefined && !map0.has(id0)){
          return;
        }
        console.log("Start search map 0")
        const searchResultMap0 = this.searchMap(id0, map0, searchIndex, index);
        searchIndex = searchResultMap0.searchIndex;
        console.log(`Search index after search map 0: ${searchIndex}`)

        const map1: NestedMapActual<E, V> = <any> map0.get(searchResultMap0.key);
        if (id1 !== undefined && !map1.has(id1)){
          return;
        }
        const searchResultMap1 = this.searchMap(id1, map1, searchIndex, index);
        searchIndex = searchResultMap1.searchIndex;
        console.log(`Search index after search map 1: ${searchIndex}`)

        const map2: NestedMapActual<E, V> = <any> map1.get(searchResultMap1.key);
        if (id2 !== undefined && !map2.has(id2)){
          return;
        }
        for (const key2 of map2.keys()){
          // In this level we don't need to check for _size_ key as this will never be present
          if(key2 !== this.protectedArrayKey){
            console.log(map2.get(key2))
            const size = (<NestedMapActual<E,V>>map2.get(key2)).size - 1;
            searchIndex += size;
            if (searchIndex > index){
              searchIndex -= size;
              const termArray = <E[]> (<NestedMapActual<E,V>>map2.get(key2)).get(<any>this.protectedArrayKey);
              // Find correct index within the array
              const tripleIndex = index - (searchIndex);
              yield <any> [searchResultMap0.key, searchResultMap1.key, key2, termArray[tripleIndex]];
            }
          }
        }
        // const searchResultMap2 = this.searchMap(id2, map2, searchIndex, index);
        // searchIndex = searchResultMap2.searchIndex;
        // console.log(`Search index after search map 2: ${searchIndex}`)


        // const map3: NestedMapActual<E, V> = <any> map2.get(searchResultMap2.key);
        // console.log(map3.get(<any> this.protectedArrayKey));
        // console.log(map3.get(<any> this.protectedCountKey));


        // // If we're here there is a match in the map for id0
        // const map0Keys = Array.from(id0 !== undefined ? [ id0 ] : map0.keys());
        // let map1Key;    
        // if (map0Keys.length > 1){
        //   for (const key1 of map0Keys){
        //     const nTriplesInMap = <number> (<NestedMapActual<E,V>>map0.get(key1)).get(<any>this.protectedCountKey);
        //     searchIndex += nTriplesInMap
        //     if (searchIndex > index){
        //       searchIndex -= nTriplesInMap;
        //       map1Key = key1;
        //     }
        //   }
        //   if (map1Key === undefined){
        //     // Error here for easy debugging, however we can also just return if this were to be actually put to use.
        //     throw new Error("Tried to sample an index which is higher than the number of triples in store.");
        //   }
        // }
        // else {
        //   // Take first element, which either means there is only one key or id0 is not undefined. In both cases
        //   // we don't have to do a search.
        //   map1Key = map0Keys[0];
        // }
        // const map1 = <any>map0.get(map1Key);
        // if (id1 !== undefined && !map1.has(id1)){
        //   return;
        // }
        // const map1Keys = Array.from(id1 !== undefined ? [ id1 ] : map1.keys());



        // for (const key1 of map0Keys) {
        //   map1 = <any>map0.get(key1);
        //   const map1Keys = id1 !== undefined ? (map1.has(id1) ? [ id1 ] : []) : map1.keys();
        //   for (const key2 of map1Keys) {
        //     map2 = <any>map1.get(key2);
        //     const map2Keys = id2 !== undefined ? (map2.has(id2) ? [ id2 ] : []) : map2.keys();
        //     for (const key3 of map2Keys) {
        //       map3 = <any>map2.get(key3);
        //       if (id3 !== undefined) {
        //         if (map3.has(id3)) {
        //           count++;
        //         }
        //       } else {
        //         // Reduce by one to ensure the _array_ property isnt counted
        //         count += map3.size - 1;
        //         // TODO: Benchmark count performance
        //         // count += (<E[]> map3.get(<any> this.protectedArrayKey )).length
        //       }
        //     }
        //   }
        // }
    


        // for (const [ i, count ] of counts.entries()) {
        //   searchIndex += count;
        //   // If count > id we take the joins associated with this sample
        //   if (index < searchIndex) {
        //     // Go back one step
        //     searchIndex -= count;
  
        //     // Find index
        //     const tripleIndex = index - (searchIndex);
  
        //     // // Get the triple associated with index
        //     // // TODO This materializes all triples that match the sample relation, should implement something to access
        //     // // only the given index
        //     // const chosenTriple = this.lookUpIndex(
        //     //   arrayIndex[''],
        //     //   sampleRelations[i][0],
        //     //   sampleRelations[i][1],
        //     //   sampleRelations[i][2],
        //     // )[tripleIndex];
        //   }
        // }
    }
  }
  /**
   * Function searching the key in a given map that contains the triple at a given index. Returns
   * the value of the searchIndex and the key where the result will be located. This assumes that
   * any key not undefined exists in the map.
   * @param id 
   * @param map 
   * @param searchIndex 
   * @param tripleIndex 
   * @returns 
   */
  private searchMap(id: E | undefined, map: NestedMapActual<E, V>, 
    searchIndex: number, tripleIndex: number): IMapSearchResult<E>{
    // If we're here there is a match in the map for id0
    const mapKeys = Array.from(id !== undefined ? [ id ] : map.keys());
    let key;    
    if (mapKeys.length > 1){
      for (const key1 of mapKeys){
        if (key1 !== this.protectedArrayKey && key1 !== this.protectedCountKey){
          // console.log(`Key: ${key1}`)
          // console.log(map);
          const nTriplesInMap = (<ICount> (<NestedMapActual<E,V>>map.get(key1)).get(<any>this.protectedCountKey)).count;
          searchIndex += nTriplesInMap
          // console.log(`Triples in map: ${nTriplesInMap}`)
          if (searchIndex > tripleIndex){
            // Go back one step
            searchIndex -= nTriplesInMap;
            key = key1;
          }  
        }
      }
      if (key === undefined){
        // Error here for easy debugging, however we can also just return if this were to be actually put to use.
        throw new Error("Tried to sample an index which is higher than the number of triples in store.");
      }
    }
    else {
      // Take first element, which either means there is only one key or id0 is not undefined. In both cases
      // we don't have to do a search.
      key = mapKeys[0];
    }
    return { key, searchIndex };
  }

  private constructCounts(ids: (E | undefined)[]){
    const counts = [];
    const [ id0, id1, id2, id3 ] = ids;

    let map1: NestedMapActual<E, V>;
    let map2: NestedMapActual<E, V>;
    let map3: NestedMapActual<E, V>;

    const map0: NestedMapActual<E, V> = this.nestedMap;
    const map0Keys = id0 !== undefined ? (map0.has(id0) ? [ id0 ] : []) : map0.keys();
    for (const key1 of map0Keys) {
      map1 = <any>map0.get(key1);
      const map1Keys = id1 !== undefined ? (map1.has(id1) ? [ id1 ] : []) : map1.keys();
      for (const key2 of map1Keys) {
        map2 = <any>map1.get(key2);
        const map2Keys = id2 !== undefined ? (map2.has(id2) ? [ id2 ] : []) : map2.keys();
        for (const key3 of map2Keys) {
          map3 = <any>map2.get(key3);
          // This case returns count of a full quad (which is always 1 or 0)
          if (id3 !== undefined){
            return map3.has(id3) ? [1] : [0]
          }
          counts.push(map3.size - 1)
        }
      }
    }
    return counts;
  }

  private getSizeLevel(nestedMap: NestedMapActual<E, V>, keys: E[]){
     const counts: number[] = [];
     for (const key of keys){
        const val = <NestedMapActual<E,V>> nestedMap.get(key)!;
        if (val.has(<any> this.protectedArrayKey)){
            counts.push((<E[]>val.get(<any> this.protectedArrayKey)!).length);
        }
        else{

        }
     }
  }

  public printMap(map: NestedMapActual<E, V>, indent = 0) {
    const padding = ' '.repeat(indent); // Indentation for nested maps
    for (const [ key, value ] of map.entries()) {
      if (value instanceof Map) {
        console.log(`${padding}${String(key)}: {`);
        this.printMap(value, indent + 2); // Recursively print nested maps with more indentation
        console.log(`${padding}}`);
      } else if (Array.isArray(value)) {
        console.log(`${padding}${String(key)}: [${value.join(', ')}]`);
      } else {
        console.log(`${padding}${String(key)}: ${value}`);
      }
    }
  }
}

export interface ICount{
    count: number;
}

export interface IMapSearchResult<E>{
  key: E,
  searchIndex: number
}

