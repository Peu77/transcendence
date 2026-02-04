import { createFormHook } from '@tanstack/react-form'

import {
  Select,
  SubscribeButton,
  TextArea,
  TextField,
  Switch,
  Slider,
} from '../components/formComponents'
import { fieldContext, formContext } from './form-context.ts'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
    Switch,
    Slider,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
