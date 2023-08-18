import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { ConstraintViolation } from "@coordinator/web/model/common";
import { validateSync, ValidationError } from "class-validator";

/**
 * Attaches a validator logic to the marked methods. Upon calling the marked method, each of the method parameters
 * are validated. For validation, the property decorators of the class-validator library should be used. Any validation
 * error triggers throwing an InvalidRequestError.
 */
export const Validated = () => {

    return (target: any, memberKey: string, descriptor: PropertyDescriptor) => {

        return {
            get() {
                const validatorWrapper = (...args: any[]) => {
                    args.forEach(value => doValidate(value));
                    return descriptor.value.apply(this, args);
                }

                Object.defineProperty(this, memberKey, {
                    value: validatorWrapper,
                    configurable: true,
                    writable: true
                });

                return validatorWrapper;
            }
        }
    };
}

function doValidate(value: any) {

    const validationResult = validateSync(value);
    if (validationResult.length > 0) {
        const formattedValidationResult = formatValidationResult(validationResult);
        throw new InvalidRequestError(formattedValidationResult);
    }
}

function formatValidationResult(validationResult: ValidationError[]) {

    return validationResult
        .map(violation => {

            const fieldViolations: ConstraintViolation[] = [];
            for (const key in violation.constraints) {
                fieldViolations.push({
                    field: violation.property,
                    constraint: key,
                    message: violation.constraints[key]
                });
            }

            return fieldViolations;
        })
        .flat();
}
