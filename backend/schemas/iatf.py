from pydantic import BaseModel, ConfigDict, validator
from datetime import date, datetime
from typing import Optional, List
from enum import Enum

class NonconformanceReportStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class CorrectiveActionRequestStatus(str, Enum):
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class PreventiveActionRequestStatus(str, Enum):
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class FMEAStatus(str, Enum):
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class PPAPStatus(str, Enum):
    APPROVED = "Approved"
    REJECTED = "Rejected"
    PENDING = "Pending"

class MeasurementStatus(str, Enum):
    ACCEPTABLE = "Acceptable"
    REJECTED = "Rejected"

class InternalAuditStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class ChangeRequestStatus(str, Enum):
    APPROVED = "Approved"
    REJECTED = "Rejected"
    PENDING = "Pending"

class CustomerComplaintStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"

class SupplierEvaluationStatus(str, Enum):
    APPROVED = "Approved"
    CONDITIONAL = "Conditional"
    REJECTED = "Rejected"

class NonconformanceReportBase(BaseModel):
    date: date
    product_id: str
    issue_description: str
    department: str
    containment_action: str
    root_cause: str
    corrective_action: str
    status: NonconformanceReportStatus
    closure_date: Optional[date] = None
    workflow_id: Optional[str] = None

class NonconformanceReportCreate(NonconformanceReportBase):
    pass

class NonconformanceReportUpdate(NonconformanceReportBase):
    date: Optional[date] = None
    product_id: Optional[str] = None
    issue_description: Optional[str] = None
    department: Optional[str] = None
    containment_action: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    status: Optional[NonconformanceReportStatus] = None

class NonconformanceReport(NonconformanceReportBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class CorrectiveActionRequestBase(BaseModel):
    ncr_id: str
    root_cause: str
    action_plan: str
    responsible: str
    execution_date: date
    effectiveness_review: str
    status: CorrectiveActionRequestStatus
    workflow_id: Optional[str] = None

class CorrectiveActionRequestCreate(CorrectiveActionRequestBase):
    pass

class CorrectiveActionRequestUpdate(CorrectiveActionRequestBase):
    ncr_id: Optional[str] = None
    root_cause: Optional[str] = None
    action_plan: Optional[str] = None
    responsible: Optional[str] = None
    execution_date: Optional[date] = None
    effectiveness_review: Optional[str] = None
    status: Optional[CorrectiveActionRequestStatus] = None

class CorrectiveActionRequest(CorrectiveActionRequestBase):
    id: str
    nonconformance_report: Optional[NonconformanceReport] = None

    model_config = ConfigDict(from_attributes=True)

class PreventiveActionRequestBase(BaseModel):
    risk_description: str
    severity: str
    likelihood: str
    proposed_action: str
    responsible: str
    result: str
    status: PreventiveActionRequestStatus
    workflow_id: Optional[str] = None

    @validator("severity", "likelihood")
    def severity_likelihood_must_be_valid(cls, v):
        if v not in ["High", "Medium", "Low"]:
            raise ValueError("Must be High, Medium, or Low")
        return v

class PreventiveActionRequestCreate(PreventiveActionRequestBase):
    pass

class PreventiveActionRequestUpdate(PreventiveActionRequestBase):
    risk_description: Optional[str] = None
    severity: Optional[str] = None
    likelihood: Optional[str] = None
    proposed_action: Optional[str] = None
    responsible: Optional[str] = None
    result: Optional[str] = None
    status: Optional[PreventiveActionRequestStatus] = None

class PreventiveActionRequest(PreventiveActionRequestBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class FMEABase(BaseModel):
    process_step: str
    failure_mode: str
    effect: str
    severity: int
    occurrence: int
    detection: int
    rpn_score: int
    proposed_action: str
    responsible: str
    status: FMEAStatus

    @validator("severity", "occurrence", "detection")
    def score_must_be_valid(cls, v):
        if not 1 <= v <= 10:
            raise ValueError("Score must be between 1 and 10")
        return v

class FMEACreate(FMEABase):
    pass

class FMEAUpdate(FMEABase):
    process_step: Optional[str] = None
    failure_mode: Optional[str] = None
    effect: Optional[str] = None
    severity: Optional[int] = None
    occurrence: Optional[int] = None
    detection: Optional[int] = None
    rpn_score: Optional[int] = None
    proposed_action: Optional[str] = None
    responsible: Optional[str] = None
    status: Optional[FMEAStatus] = None

class FMEA(FMEABase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class PPAPBase(BaseModel):
    part_id: str
    submission_date: date
    level: str
    dfmea: bool
    pfmea: bool
    control_plan: bool
    dimensional_results: bool
    master_sample: bool
    status: PPAPStatus

    @validator("level")
    def level_must_be_valid(cls, v):
        if v not in ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]:
            raise ValueError("Level must be Level 1 to Level 5")
        return v

class PPAPCreate(PPAPBase):
    pass

class PPAPUpdate(PPAPBase):
    part_id: Optional[str] = None
    submission_date: Optional[date] = None
    level: Optional[str] = None
    dfmea: Optional[bool] = None
    pfmea: Optional[bool] = None
    control_plan: Optional[bool] = None
    dimensional_results: Optional[bool] = None
    master_sample: Optional[bool] = None
    status: Optional[PPAPStatus] = None

class PPAP(PPAPBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class ProcessBase(BaseModel):
    control_plan_id: str
    step: int
    description: str
    control_characteristic: str
    measurement_method: str
    frequency: str
    tolerance: str
    nonconformance_action: str

    @validator("step")
    def step_must_be_positive(cls, v):
        if v < 1:
            raise ValueError("Step must be positive")
        return v

class ProcessCreate(ProcessBase):
    pass

class ProcessUpdate(ProcessBase):
    control_plan_id: Optional[str] = None
    step: Optional[int] = None
    description: Optional[str] = None
    control_characteristic: Optional[str] = None
    measurement_method: Optional[str] = None
    frequency: Optional[str] = None
    tolerance: Optional[str] = None
    nonconformance_action: Optional[str] = None

class Process(ProcessBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ControlPlanBase(BaseModel):
    part_name: str
    part_number: str
    stage: str

class ControlPlanCreate(ControlPlanBase):
    process_ids: List[int] = []

class ControlPlanUpdate(ControlPlanBase):
    part_name: Optional[str] = None
    part_number: Optional[str] = None
    stage: Optional[str] = None
    process_ids: Optional[List[int]] = None

class ControlPlan(ControlPlanBase):
    id: str
    processes: List[Process] = []

    model_config = ConfigDict(from_attributes=True)

class MeasurementBase(BaseModel):
    dimensional_result_id: str
    characteristic: str
    nominal_value: float
    tolerance: str
    measured_value: float
    status: MeasurementStatus

class MeasurementCreate(MeasurementBase):
    pass

class MeasurementUpdate(MeasurementBase):
    dimensional_result_id: Optional[str] = None
    characteristic: Optional[str] = None
    nominal_value: Optional[float] = None
    tolerance: Optional[str] = None
    measured_value: Optional[float] = None
    status: Optional[MeasurementStatus] = None

class Measurement(MeasurementBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class DimensionalResultsBase(BaseModel):
    part_number: str
    drawing_number: str
    date: date
    operator: str

class DimensionalResultsCreate(DimensionalResultsBase):
    measurement_ids: List[int] = []

class DimensionalResultsUpdate(DimensionalResultsBase):
    part_number: Optional[str] = None
    drawing_number: Optional[str] = None
    date: Optional[date] = None
    operator: Optional[str] = None
    measurement_ids: Optional[List[int]] = None

class DimensionalResults(DimensionalResultsBase):
    id: str
    measurements: List[Measurement] = []

    model_config = ConfigDict(from_attributes=True)

class MasterSampleRecordBase(BaseModel):
    part_name: str
    part_number: str
    drawing_number: str
    registration_date: date
    storage_location: str
    status: str
    review_date: date
    responsible: str
    notes: str

class MasterSampleRecordCreate(MasterSampleRecordBase):
    pass

class MasterSampleRecordUpdate(MasterSampleRecordBase):
    part_name: Optional[str] = None
    part_number: Optional[str] = None
    drawing_number: Optional[str] = None
    registration_date: Optional[date] = None
    storage_location: Optional[str] = None
    status: Optional[str] = None
    review_date: Optional[date] = None
    responsible: Optional[str] = None
    notes: Optional[str] = None

class MasterSampleRecord(MasterSampleRecordBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class InternalAuditBase(BaseModel):
    scope: str
    criteria: str
    auditor: str
    audited_department: str
    date: date
    findings: str
    status: InternalAuditStatus
    recommendation: str
    workflow_id: Optional[str] = None

class InternalAuditCreate(InternalAuditBase):
    pass

class InternalAuditUpdate(InternalAuditBase):
    scope: Optional[str] = None
    criteria: Optional[str] = None
    auditor: Optional[str] = None
    audited_department: Optional[str] = None
    date: Optional[date] = None
    findings: Optional[str] = None
    status: Optional[InternalAuditStatus] = None
    recommendation: Optional[str] = None

class InternalAudit(InternalAuditBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class ChangeRequestBase(BaseModel):
    description: str
    affected_documents: str
    reason: str
    approval_status: ChangeRequestStatus
    validation_notes: str
    date: date
    workflow_id: Optional[str] = None

class ChangeRequestCreate(ChangeRequestBase):
    pass

class ChangeRequestUpdate(ChangeRequestBase):
    description: Optional[str] = None
    affected_documents: Optional[str] = None
    reason: Optional[str] = None
    approval_status: Optional[ChangeRequestStatus] = None
    validation_notes: Optional[str] = None
    date: Optional[date] = None

class ChangeRequest(ChangeRequestBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class CustomerComplaintBase(BaseModel):
    customer: str
    date: date
    description: str
    product_id: str
    solution: str
    status: CustomerComplaintStatus
    workflow_id: Optional[str] = None

class CustomerComplaintCreate(CustomerComplaintBase):
    pass

class CustomerComplaintUpdate(CustomerComplaintBase):
    customer: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    product_id: Optional[str] = None
    solution: Optional[str] = None
    status: Optional[CustomerComplaintStatus] = None

class CustomerComplaint(CustomerComplaintBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class SupplierEvaluationBase(BaseModel):
    supplier_name: str
    quality_score: int
    delivery_score: int
    responsiveness_score: int
    audit_result: str
    status: SupplierEvaluationStatus

    @validator("quality_score", "delivery_score", "responsiveness_score")
    def score_must_be_valid(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("Score must be between 0 and 100")
        return v

class SupplierEvaluationCreate(SupplierEvaluationBase):
    pass

class SupplierEvaluationUpdate(SupplierEvaluationBase):
    supplier_name: Optional[str] = None
    quality_score: Optional[int] = None
    delivery_score: Optional[int] = None
    responsiveness_score: Optional[int] = None
    audit_result: Optional[str] = None
    status: Optional[SupplierEvaluationStatus] = None

class SupplierEvaluation(SupplierEvaluationBase):
    id: str

    model_config = ConfigDict(from_attributes=True)