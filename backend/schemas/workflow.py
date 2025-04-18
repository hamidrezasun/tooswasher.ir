# schemas/workflow.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WorkflowBase(BaseModel):
    title: str
    status: Optional[str] = "Draft"
    approver_id: Optional[int]
    is_template: Optional[bool] = False
    uploaded_files: Optional[List[str]] = []
    parent_workflow_id: Optional[int]

class WorkflowCreate(WorkflowBase):
    viewer_ids: Optional[List[int]] = []
    responsible_user_ids: Optional[List[int]] = []

class WorkflowCreateFromTemplate(BaseModel):
    title: str
    template_workflow_id: int
    status: Optional[str] = "Draft"
    approver_id: Optional[int]
    uploaded_files: Optional[List[str]] = []
    parent_workflow_id: Optional[int]
    viewer_ids: Optional[List[int]] = []
    responsible_user_ids: Optional[List[int]] = []
    step_overrides: Optional[List[dict]] = []  # Overrides for expected_duration, etc.

class WorkflowUpdate(WorkflowBase):
    viewer_ids: Optional[List[int]]
    responsible_user_ids: Optional[List[int]]

class WorkflowInDB(WorkflowBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowStepBase(BaseModel):
    step_number: int
    description: str
    status: Optional[str] = "Pending"
    is_mandatory: Optional[bool] = False
    is_additional: Optional[bool] = False
    template_step_id: Optional[int]
    expected_duration: Optional[int]
    required_documents: Optional[str]
    output: Optional[str]
    escalation_contact_id: Optional[int]
    uploaded_files: Optional[List[str]] = []
    completed_at: Optional[datetime]
    completed_by: Optional[str]

class WorkflowStepCreate(WorkflowStepBase):
    responsible_user_ids: Optional[List[int]] = []

class WorkflowStepUpdate(WorkflowStepBase):
    responsible_user_ids: Optional[List[int]]

class WorkflowStepInDB(WorkflowStepBase):
    id: int
    workflow_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowStepTemplateBase(BaseModel):
    step_number: int
    description: str
    is_mandatory: Optional[bool] = False
    default_expected_duration: Optional[int]
    default_required_documents: Optional[str]
    default_output: Optional[str]
    next_step_on_success: Optional[int]
    next_step_on_failure: Optional[int]

class WorkflowStepTemplateCreate(WorkflowStepTemplateBase):
    pass

class WorkflowStepTemplateInDB(WorkflowStepTemplateBase):
    id: int
    workflow_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True