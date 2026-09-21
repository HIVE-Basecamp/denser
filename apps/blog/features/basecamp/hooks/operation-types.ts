'use client';

import { getChain } from '@transaction/lib/chain';

/**
 * The chain's table of operation type ids, asked for once for the whole
 * session.
 *
 * Every read Basecamp makes has to name its operations by number, and the
 * numbers are the same for every account and never change: a vote has been
 * operation zero since the chain began. The table was being fetched by eight
 * different hooks, several of them once per card — measured on the live feed
 * on 2026-09-21, one page of twelve cards fetched it twenty-five times, which
 * is twenty-four round trips and 190KB spent learning the same thing.
 *
 * This is deliberately not a React Query: the callers are plain async
 * functions inside other queries, and a promise held here is shared by all of
 * them without any of them having to know about the others.
 */
let tablePromise: Promise<ReadonlyMap<string, number>> | null = null;

function operationTypeTable(): Promise<ReadonlyMap<string, number>> {
  if (!tablePromise) {
    tablePromise = (async () => {
      const chain = await getChain();
      const opTypes = await chain.restApi['hafah-api']['operation-types']();
      const table = new Map<string, number>();
      for (const opType of opTypes) {
        if (typeof opType.operation_name === 'string' && typeof opType.op_type_id === 'number') {
          table.set(opType.operation_name, opType.op_type_id);
        }
      }
      return table;
    })().catch((error: unknown) => {
      // A failed lookup must not be kept as the answer, or every later card in
      // the session inherits one bad moment on the node.
      tablePromise = null;
      throw error;
    });
  }
  return tablePromise;
}

/** One operation's id, or nothing where this node does not report that name. */
export async function operationTypeIdOf(name: string): Promise<number | undefined> {
  return (await operationTypeTable()).get(name);
}

/**
 * Ids for several names, in the order given, with a gap where a name is
 * unknown. Callers decide what a gap means: some cannot read at all without
 * it, others simply ask for less.
 */
export async function operationTypeIdsOf(names: readonly string[]): Promise<(number | undefined)[]> {
  const table = await operationTypeTable();
  return names.map((name) => table.get(name));
}
