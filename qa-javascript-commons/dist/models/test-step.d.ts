import { StepGherkinData, StepRequestData, StepTextData } from './step-data';
import { StepExecution } from './step-execution';
import { Attachment } from './attachment';
/** Step type discriminant and step record. */
export declare enum StepType {
    TEXT = "text",
    GHERKIN = "gherkin",
    REQUEST = "request"
}
export declare class TestStepType {
    id: string;
    step_type: StepType;
    data: StepTextData | StepGherkinData | StepRequestData;
    parent_id: string | null;
    execution: StepExecution;
    attachments: Attachment[];
    steps: TestStepType[];
    constructor(type?: StepType);
}
