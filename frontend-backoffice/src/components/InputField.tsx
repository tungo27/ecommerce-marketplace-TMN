import React from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

type InputFieldProps = TextFieldProps & {
  label: string;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  ...props
}) => {
  return (
    <TextField
      label={label}
      variant="outlined"
      fullWidth
      size="small"
      {...props}
    />
  );
};
