import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { InputFieldProps } from './types';
import { getFieldId } from './utils';

const InputField: React.FC<InputFieldProps> = ({
  label,
  helperText,
  isRequired,
  onChange,
  validate,
  ...props
}) => {
  const [field, { touched, error }] = useField({ name: props.name, validate });
  const fieldId = getFieldId(props.name, 'input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helperText}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired={isRequired}
    >
      <TextInput
        {...field}
        {...props}
        css={{}} // TODO(jtomasek): remove this once it is not required
        id={fieldId}
        isValid={isValid}
        isRequired={isRequired}
        aria-describedby={`${fieldId}-helper`}
        onChange={(value, event) => {
          field.onChange(event);
          onChange && onChange(event);
        }}
      />
    </FormGroup>
  );
};

export default InputField;
