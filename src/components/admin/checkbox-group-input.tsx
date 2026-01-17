import * as React from "react";
import type { ChoicesProps, InputProps } from "ra-core";
import { FieldTitle, useChoices, useChoicesContext, useInput } from "ra-core";
import { cn } from "@/lib/utils";
import {
    FormField,
    FormControl,
    FormLabel,
    FormError,
} from "@/components/admin/form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { InputHelperText } from "@/components/admin/input-helper-text";

/**
 * Input rendered as a list of checkboxes, allowing multiple selection.
 *
 * Use `<CheckboxGroupInput>` when you have a small set of options (2-5) that users should
 * see all at once and select multiple from. For larger sets, consider `AutocompleteArrayInput`.
 */
export const CheckboxGroupInput = (inProps: CheckboxGroupInputProps) => {
    const {
        choices: choicesProp,
        isFetching: isFetchingProp,
        isLoading: isLoadingProp,
        isPending: isPendingProp,
        resource: resourceProp,
        source: sourceProp,

        format,
        onBlur,
        onChange,
        parse,
        validate,
        disabled,
        readOnly,

        optionText,
        optionValue = "id",
        translateChoice,
        disableValue = "disabled",

        className,
        helperText,
        label,
        row,
        ...rest
    } = inProps;

    const {
        allChoices,
        isPending,
        error: fetchError,
        resource,
        source,
    } = useChoicesContext({
        choices: choicesProp,
        isFetching: isFetchingProp,
        isLoading: isLoadingProp,
        isPending: isPendingProp,
        resource: resourceProp,
        source: sourceProp,
    });

    if (source === undefined) {
        throw new Error(
            `If you're not wrapping the CheckboxGroupInput inside a ReferenceArrayInput, you must provide the source prop`,
        );
    }

    if (!isPending && !fetchError && allChoices === undefined) {
        throw new Error(
            `If you're not wrapping the CheckboxGroupInput inside a ReferenceArrayInput, you must provide the choices prop`,
        );
    }

    const { id, field, isRequired } = useInput({
        format,
        onBlur,
        onChange,
        parse,
        resource,
        source,
        validate,
        disabled,
        readOnly,
        ...rest,
    });

    const { getChoiceText, getChoiceValue, getDisableValue } = useChoices({
        optionText,
        optionValue,
        translateChoice,
        disableValue,
    });

    if (isPending) {
        return <Skeleton className="w-full h-9" />;
    }

    const handleCreateChange = (event: boolean | string, choiceValue: any) => {
        const currentValues = Array.isArray(field.value) ? [...field.value] : [];
        if (event) {
            // Add
            if (!currentValues.includes(choiceValue)) {
                field.onChange([...currentValues, choiceValue]);
            }
        } else {
            // Remove
            const index = currentValues.indexOf(choiceValue);
            if (index > -1) {
                currentValues.splice(index, 1);
                field.onChange(currentValues);
            }
        }
    };

    return (
        <FormField id={id} className={className} name={field.name}>
            {label !== false && (
                <FormLabel>
                    <FieldTitle
                        label={label}
                        source={source}
                        resource={resource}
                        isRequired={isRequired}
                    />
                </FormLabel>
            )}

            <FormControl>
                <div className={cn(
                    "flex items-center min-h-[40px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
                    row ? "flex-row gap-4" : "flex-col gap-3 h-auto py-3"
                )}>
                    {allChoices?.map((choice) => {
                        const value = getChoiceValue(choice);
                        const isDisabled = disabled || readOnly || getDisableValue(choice);
                        const isChecked = Array.isArray(field.value) && field.value.includes(value);
                        const choiceId = `${id}-${value}`;

                        return (
                            <div key={value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={choiceId}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => handleCreateChange(checked, value)}
                                    disabled={isDisabled}
                                />
                                <Label
                                    htmlFor={choiceId}
                                    className={cn(
                                        "text-sm font-normal cursor-pointer",
                                        isDisabled && "opacity-50 cursor-not-allowed",
                                    )}
                                >
                                    {getChoiceText(choice)}
                                </Label>
                            </div>
                        );
                    })}
                </div>
            </FormControl>
            <InputHelperText helperText={helperText} />
            <FormError />
        </FormField>
    );
};

export interface CheckboxGroupInputProps
    extends Partial<InputProps>,
    ChoicesProps {
    row?: boolean;
}
