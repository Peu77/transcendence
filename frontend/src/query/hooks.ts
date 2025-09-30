import { useEffect, useRef, useState } from "refreshjs";
import {
  QueryObserver,
  MutationObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
  type MutationObserverOptions,
  type DefaultError,
  type QueryKey,
} from "@tanstack/query-core";
import { queryClient } from "./client";

export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = ReturnType<
  MutationObserver<TData, TError, TVariables, TContext>["getCurrentResult"]
> & {
  mutate: (
    variables: TVariables,
    mutateOptions?: Omit<
      MutationObserverOptions<TData, TError, TVariables, TContext>,
      "mutationFn"
    >,
  ) => void;
  mutateAsync: (
    variables: TVariables,
    mutateOptions?: Omit<
      MutationObserverOptions<TData, TError, TVariables, TContext>,
      "mutationFn"
    >,
  ) => Promise<TData>;
  reset: () => void;
};

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >,
): QueryObserverResult<TData, TError> {
  const observerRef = useRef<QueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  > | null>(null);

  const [result, setResult] = useState<QueryObserverResult<TData, TError>>(
    () => {
      const obs = new QueryObserver<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey
      >(queryClient, options);
      observerRef.current = obs;
      return (obs.getOptimisticResult as any)(options);
    },
  );

  useEffect(() => {
    let obs = observerRef.current;
    if (!obs) {
      obs = new QueryObserver<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey
      >(queryClient, options);
      observerRef.current = obs;
    }
    const unsubscribe = obs.subscribe(setResult);
    obs.setOptions(options as any);
    return () => unsubscribe();
  }, [queryClient, options]);

  return result;
}

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: MutationObserverOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const observerRef = useRef<MutationObserver<
    TData,
    TError,
    TVariables,
    TContext
  > | null>(null);

  const [result, setResult] = useState(() =>
    new MutationObserver<TData, TError, TVariables, TContext>(
      queryClient,
      options,
    ).getCurrentResult(),
  );

  useEffect(() => {
    let obs = observerRef.current;
    if (!obs) {
      obs = new MutationObserver<TData, TError, TVariables, TContext>(
        queryClient,
        options,
      );
      observerRef.current = obs;
    }
    const unsubscribe = obs.subscribe(setResult);
    obs.setOptions(options as any);
    return () => unsubscribe();
  }, [queryClient, options]);

  const mutateAsync = (
    variables: TVariables,
    mutateOptions?: Omit<
      MutationObserverOptions<TData, TError, TVariables, TContext>,
      "mutationFn"
    >,
  ) => observerRef.current!.mutate(variables, mutateOptions as any);

  const mutate = (
    variables: TVariables,
    mutateOptions?: Omit<
      MutationObserverOptions<TData, TError, TVariables, TContext>,
      "mutationFn"
    >,
  ) => {
    void observerRef.current!.mutate(variables, mutateOptions as any);
  };

  const reset = () => observerRef.current!.reset();

  return { ...result, mutate, mutateAsync, reset } as UseMutationResult<
    TData,
    TError,
    TVariables,
    TContext
  >;
}
