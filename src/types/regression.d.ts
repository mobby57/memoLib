declare module 'regression' {
  export type DataPoint = [number, number]
  
  export interface RegressionResult {
    equation: number[]
    points: DataPoint[]
    r2: number
    string: string
    predict(x: number): [number, number]
  }

  export interface Options {
    order?: number
    precision?: number
  }

  export function linear(data: DataPoint[], options?: Options): RegressionResult
  export function exponential(data: DataPoint[], options?: Options): RegressionResult
  export function logarithmic(data: DataPoint[], options?: Options): RegressionResult
  export function power(data: DataPoint[], options?: Options): RegressionResult
  export function polynomial(data: DataPoint[], options?: Options): RegressionResult

  const regression: {
    linear: typeof linear
    exponential: typeof exponential
    logarithmic: typeof logarithmic
    power: typeof power
    polynomial: typeof polynomial
  }

  export default regression
}
