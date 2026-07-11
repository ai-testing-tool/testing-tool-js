import { TestStepType } from './test-step';
import { Attachment } from './attachment';
import { TestExecution } from './test-execution';

/**
 * Normalized test result for Forge ingest.
 * Jira traceability via title/tags (issue keys).
 */
export class TestResultType {
  id: string;
  title: string;
  signature: string;
  execution: TestExecution;
  fields: Record<string, string>;
  attachments: Attachment[];
  steps: TestStepType[];
  params: Record<string, string>;
  group_params: Record<string, string>;
  author: string | null;
  relations: Relation | null;
  muted: boolean;
  message: string | null;
  tags: string[];
  preparedAttachments?: string[];

  constructor(title: string) {
    this.id = '';
    this.title = title;
    this.signature = '';
    this.execution = new TestExecution();
    this.fields = {};
    this.attachments = [];
    this.steps = [];
    this.params = {};
    this.group_params = {};
    this.author = null;
    this.relations = null;
    this.muted = false;
    this.message = null;
    this.tags = [];
    this.preparedAttachments = [];
  }
}

export interface Relation {
  suite?: Suite;
}

export interface Suite {
  data: SuiteData[];
}

export interface SuiteData {
  title: string;
}
