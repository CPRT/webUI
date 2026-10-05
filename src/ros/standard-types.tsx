export interface ParameterValue {
  type?: number,
  bool_value?: boolean;
  integer_value?: number;
  double_value?: number;
  string_value?: string;
};

export interface Parameter {
  name: string;
  value: { type: number } & Partial<ParameterValue>
}

export interface GetParametersRequest { names: string[]; };
export interface GetParametersResponse { values?: ParameterValue[]; };

export interface SetParametersRequest { parameters: Parameter[]; }
export interface SetParametersResponse { results: { successful: boolean, reason: string }[]; }

export interface TriggerResponse { success: boolean; message: string; }