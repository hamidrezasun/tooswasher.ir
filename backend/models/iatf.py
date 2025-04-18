from sqlalchemy import Column, Integer, String, Date, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class NonconformanceReport(Base):
    __tablename__ = "nonconformance_reports"

    id = Column(String, primary_key=True, index=True)  # e.g., NCR-2025-001
    date = Column(Date, nullable=False)  # Date of issue
    product_id = Column(String, nullable=False)  # Product identifier
    issue_description = Column(String, nullable=False)  # Detailed nonconformance description
    department = Column(String, nullable=False)  # Responsible department
    containment_action = Column(String, nullable=False)  # Immediate containment measures
    root_cause = Column(String, nullable=False)  # Root cause analysis per IATF
    corrective_action = Column(String, nullable=False)  # Corrective action plan
    status = Column(String, nullable=False)  # Open, Closed, etc.
    closure_date = Column(Date, nullable=True)  # Date of closure, nullable if open
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=True)  # Link to workflow

    workflow = relationship("Workflow", back_populates="nonconformance_reports")

class CorrectiveActionRequest(Base):
    __tablename__ = "corrective_action_requests"

    id = Column(String, primary_key=True, index=True)  # e.g., CAR-2025-005
    ncr_id = Column(String, ForeignKey("nonconformance_reports.id"), nullable=False)  # Link to NCR
    root_cause = Column(String, nullable=False)  # Detailed root cause
    action_plan = Column(String, nullable=False)  # Planned corrective actions
    responsible = Column(String, nullable=False)  # Assigned person
    execution_date = Column(Date, nullable=False)  # Planned execution date
    effectiveness_review = Column(String, nullable=False)  # Effectiveness verification plan
    status = Column(String, nullable=False)  # In Progress, Completed, etc.
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=True)  # Link to workflow

    nonconformance_report = relationship("NonconformanceReport")
    workflow = relationship("Workflow", back_populates="corrective_action_requests")

class PreventiveActionRequest(Base):
    __tablename__ = "preventive_action_requests"

    id = Column(String, primary_key=True, index=True)  # e.g., PAR-2025-003
    risk_description = Column(String, nullable=False)  # Risk or potential issue
    severity = Column(String, nullable=False)  # Risk severity (High, Medium, Low)
    likelihood = Column(String, nullable=False)  # Probability of occurrence
    proposed_action = Column(String, nullable=False)  # Preventive action plan
    responsible = Column(String, nullable=False)  # Assigned person
    result = Column(String, nullable=False)  # Outcome of action
    status = Column(String, nullable=False)  # Completed, In Progress, etc.
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=True)  # Link to workflow

    workflow = relationship("Workflow", back_populates="preventive_action_requests")

class FMEA(Base):
    __tablename__ = "fmeas"

    id = Column(String, primary_key=True, index=True)  # e.g., FMEA-2025-007
    process_step = Column(String, nullable=False)  # Process step analyzed
    failure_mode = Column(String, nullable=False)  # Potential failure mode
    effect = Column(String, nullable=False)  # Effect of failure
    severity = Column(Integer, nullable=False)  # Severity score (1-10)
    occurrence = Column(Integer, nullable=False)  # Occurrence score (1-10)
    detection = Column(Integer, nullable=False)  # Detection score (1-10)
    rpn_score = Column(Integer, nullable=False)  # Risk Priority Number
    proposed_action = Column(String, nullable=False)  # Recommended action
    responsible = Column(String, nullable=False)  # Assigned person
    status = Column(String, nullable=False)  # In Progress, Completed, etc.

class PPAP(Base):
    __tablename__ = "ppaps"

    id = Column(String, primary_key=True, index=True)  # e.g., PPAP-2025-010
    part_id = Column(String, nullable=False)  # Part identifier
    submission_date = Column(Date, nullable=False)  # Submission date
    level = Column(String, nullable=False)  # PPAP level (1-5)
    dfmea = Column(Boolean, nullable=False)  # Design FMEA included
    pfmea = Column(Boolean, nullable=False)  # Process FMEA included
    control_plan = Column(Boolean, nullable=False)  # Control plan included
    dimensional_results = Column(Boolean, nullable=False)  # Dimensional results included
    master_sample = Column(Boolean, nullable=False)  # Master sample included
    status = Column(String, nullable=False)  # Approved, Rejected, etc.

class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True, index=True)
    control_plan_id = Column(String, ForeignKey("control_plans.id"), nullable=False)
    step = Column(Integer, nullable=False)  # Process step number
    description = Column(String, nullable=False)  # Process description
    control_characteristic = Column(String, nullable=False)  # Controlled characteristic
    measurement_method = Column(String, nullable=False)  # Measurement method
    frequency = Column(String, nullable=False)  # Inspection frequency
    tolerance = Column(String, nullable=False)  # Tolerance specification
    nonconformance_action = Column(String, nullable=False)  # Action if nonconforming

    control_plan = relationship("ControlPlan")

class ControlPlan(Base):
    __tablename__ = "control_plans"

    id = Column(String, primary_key=True, index=True)  # e.g., CP-2025-001
    part_name = Column(String, nullable=False)  # Part name
    part_number = Column(String, nullable=False)  # Part number
    stage = Column(String, nullable=False)  # Production stage

    processes = relationship("Process")

class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    dimensional_result_id = Column(String, ForeignKey("dimensional_results.id"), nullable=False)
    characteristic = Column(String, nullable=False)  # Measured characteristic
    nominal_value = Column(Float, nullable=False)  # Nominal value
    tolerance = Column(String, nullable=False)  # Tolerance range
    measured_value = Column(Float, nullable=False)  # Measured value
    status = Column(String, nullable=False)  # Acceptable, Rejected, etc.

    dimensional_result = relationship("DimensionalResults")

class DimensionalResults(Base):
    __tablename__ = "dimensional_results"

    id = Column(String, primary_key=True, index=True)  # e.g., DR-2025-014
    part_number = Column(String, nullable=False)  # Part number
    drawing_number = Column(String, nullable=False)  # Drawing number
    date = Column(Date, nullable=False)  # Measurement date
    operator = Column(String, nullable=False)  # Operator name

    measurements = relationship("Measurement")

class MasterSampleRecord(Base):
    __tablename__ = "master_sample_records"

    id = Column(String, primary_key=True, index=True)  # e.g., MS-2025-007
    part_name = Column(String, nullable=False)  # Part name
    part_number = Column(String, nullable=False)  # Part number
    drawing_number = Column(String, nullable=False)  # Drawing number
    registration_date = Column(Date, nullable=False)  # Registration date
    storage_location = Column(String, nullable=False)  # Storage location
    status = Column(String, nullable=False)  # Condition (e.g., Intact)
    review_date = Column(Date, nullable=False)  # Next review date
    responsible = Column(String, nullable=False)  # Responsible person
    notes = Column(String, nullable=False)  # Additional notes

class InternalAudit(Base):
    __tablename__ = "internal_audits"

    id = Column(String, primary_key=True, index=True)  # e.g., AUD-2025-004
    scope = Column(String, nullable=False)  # Audit scope
    criteria = Column(String, nullable=False)  # Audit criteria (e.g., IATF 16949)
    auditor = Column(String, nullable=False)  # Auditor name
    audited_department = Column(String, nullable=False)  # Audited department
    date = Column(Date, nullable=False)  # Audit date
    findings = Column(String, nullable=False)  # Audit findings
    status = Column(String, nullable=False)  # Open, Closed, etc.
    recommendation = Column(String, nullable=False)  # Recommendations
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=True)  # Link to workflow

    workflow = relationship("Workflow", back_populates="internal_audits")

class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id = Column(String, primary_key=True, index=True)  # e.g., CR-2025-002
    description = Column(String, nullable=False)  # Change description
    affected_documents = Column(String, nullable=False)  # Affected documents
    reason = Column(String, nullable=False)  # Reason for change
    approval_status = Column(String, nullable=False)  # Approved, Rejected, etc.
    validation_notes = Column(String, nullable=False)  # Validation results
    date = Column(Date, nullable=False)  # Change request date
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=True)  # Link to workflow

    workflow = relationship("Workflow", back_populates="change_requests")

class CustomerComplaint(Base):
    __tablename__ = "customer_complaints"

    id = Column(String, primary_key=True, index=True)  # e.g., CC-2025-009
    customer = Column(String, nullable=False)  # Customer name
    date = Column(Date, nullable=False)  # Complaint date
    description = Column(String, nullable=False)  # Complaint description
    product_id = Column(String, nullable=False)  # Product identifier
    solution = Column(String, nullable=False)  # Resolution provided
    status = Column(String, nullable=False)  # Closed, Open, etc.
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=True)  # Link to workflow

    workflow = relationship("Workflow", back_populates="customer_complaints")

class SupplierEvaluation(Base):
    __tablename__ = "supplier_evaluations"

    id = Column(String, primary_key=True, index=True)  # e.g., SE-2025-006
    supplier_name = Column(String, nullable=False)  # Supplier name
    quality_score = Column(Integer, nullable=False)  # Quality performance score
    delivery_score = Column(Integer, nullable=False)  # Delivery performance score
    responsiveness_score = Column(Integer, nullable=False)  # Responsiveness score
    audit_result = Column(String, nullable=False)  # Audit outcome
    status = Column(String, nullable=False)  # Approved, Conditional, etc.

    #sample data
    ''''
    {
  "nonconformance_reports": [
    {
      "id": "NCR-2025-001",
      "date": "2025-04-14",
      "product_id": "PRD-3021",
      "issue_description": "Crack in weld during final assembly",
      "department": "Production",
      "containment_action": "Isolate defective parts and inspect fully",
      "root_cause": "Incorrect machine settings",
      "corrective_action": "Calibrate machine and train operator",
      "status": "Open",
      "closure_date": null,
      "workflow_id": "WF-2025-001"
    }
  ],
  "corrective_action_requests": [
    {
      "id": "CAR-2025-005",
      "ncr_id": "NCR-2025-001",
      "root_cause": "Lack of regular calibration",
      "action_plan": "Establish calibration schedule",
      "responsible": "Ali Rezaei",
      "execution_date": "2025-04-20",
      "effectiveness_review": "Monitor defect rate next month",
      "status": "In Progress",
      "workflow_id": "WF-2025-001"
    }
  ],
  "preventive_action_requests": [
    {
      "id": "PAR-2025-003",
      "risk_description": "Circuit failure during transportation",
      "severity": "High",
      "likelihood": "Medium",
      "proposed_action": "Add protective foam",
      "responsible": "Sara Mousavi",
      "result": "Action validated and documented",
      "status": "Completed",
      "workflow_id": null
    }
  ],
  "fmeas": [
    {
      "id": "FMEA-2025-007",
      "process_step": "Board installation",
      "failure_mode": "Incomplete connection",
      "effect": "Device malfunction",
      "severity": 9,
      "occurrence": 4,
      "detection": 3,
      "rpn_score": 108,
      "proposed_action": "Increase inspections",
      "responsible": "Mehdi Ahmadi",
      "status": "In Progress"
    }
  ],
  "ppaps": [
    {
      "id": "PPAP-2025-010",
      "part_id": "PCX-845",
      "submission_date": "2025-04-10",
      "level": "Level 3",
      "dfmea": true,
      "pfmea": true,
      "control_plan": true,
      "dimensional_results": true,
      "master_sample": true,
      "status": "Approved"
    }
  ],
  "control_plans": [
    {
      "id": "CP-2025-001",
      "part_name": "Motor Bracket",
      "part_number": "BR-8452",
      "stage": "Final Production",
      "processes": [
        {
          "id": 1,
          "control_plan_id": "CP-2025-001",
          "step": 1,
          "description": "Sheet cutting",
          "control_characteristic": "Initial dimensions",
          "measurement_method": "Caliper",
          "frequency": "Every 1 hour",
          "tolerance": "+/- 0.2mm",
          "nonconformance_action": "Stop production and reset"
        },
        {
          "id": 2,
          "control_plan_id": "CP-2025-001",
          "step": 2,
          "description": "Welding",
          "control_characteristic": "Weld strength",
          "measurement_method": "Tensile test",
          "frequency": "Every 50 parts",
          "tolerance": "> 500N",
          "nonconformance_action": "Review and retrain"
        }
      ]
    }
  ],
  "dimensional_results": [
    {
      "id": "DR-2025-014",
      "part_number": "BR-8452",
      "drawing_number": "DRW-3056",
      "date": "2025-04-14",
      "operator": "Reza Ahmadi",
      "measurements": [
        {
          "id": 1,
          "dimensional_result_id": "DR-2025-014",
          "characteristic": "Overall length",
          "nominal_value": 150.0,
          "tolerance": "+/- 0.3",
          "measured_value": 149.8,
          "status": "Acceptable"
        },
        {
          "id": 2,
          "dimensional_result_id": "DR-2025-014",
          "characteristic": "Hole diameter",
          "nominal_value": 10.0,
          "tolerance": "+0.1/-0.2",
          "measured_value": 10.15,
          "status": "Rejected"
        }
      ]
    }
  ],
  "master_sample_records": [
    {
      "id": "MS-2025-007",
      "part_name": "Motor Bracket",
      "part_number": "BR-8452",
      "drawing_number": "DRW-3056",
      "registration_date": "2025-04-10",
      "storage_location": "Shelf 4 - Quality Control Room",
      "status": "Intact",
      "review_date": "2026-04-10",
      "responsible": "Mehdi Sharifi",
      "notes": "For reference and comparison of production samples"
    }
  ],
  "internal_audits": [
    {
      "id": "AUD-2025-004",
      "scope": "Final Assembly",
      "criteria": "ISO 9001 and internal guidelines",
      "auditor": "Zahra Karimi",
      "audited_department": "Production",
      "date": "2025-04-05",
      "findings": "Missing test records",
      "status": "Open",
      "recommendation": "Implement test checklist",
      "workflow_id": null
    }
  ],
  "change_requests": [
    {
      "id": "CR-2025-002",
      "description": "Change switch location on panel",
      "affected_documents": "Drawing and work instruction",
      "reason": "Improved ergonomics",
      "approval_status": "Approved",
      "validation_notes": "Change successfully implemented",
      "date": "2025-04-12",
      "workflow_id": null
    }
  ],
  "customer_complaints": [
    {
      "id": "CC-2025-009",
      "customer": "RayanTech Co.",
      "date": "2025-04-03",
      "description": "Damaged part in packaging",
      "product_id": "RT-X91",
      "solution": "Reshipment and improved packaging",
      "status": "Closed",
      "workflow_id": "WF-2025-002"
    }
  ],
  "supplier_evaluations": [
    {
      "id": "SE-2025-006",
      "supplier_name": "East Parts Supply",
      "quality_score": 90,
      "delivery_score": 85,
      "responsiveness_score": 75,
      "audit_result": "Compliant",
      "status": "Approved"
    }
  ],
  "workflows": [
    {
      "id": "WF-TMPL-NCR",
      "title": "Nonconformance Handling",
      "description": "Standard process for handling nonconformances",
      "is_template": true,
      "parent_workflow_id": null,
      "version": "1.0",
      "created_at": "2025-04-17T10:00:00Z",
      "updated_at": null,
      "created_by": "Quality Manager",
      "status": "Active",
      "is_approved": true,
      "approved_by": "Operations Director",
      "approval_date": "2025-04-17T12:00:00Z",
      "related_process": "Quality Control",
      "priority": "High",
      "notes": "Template for NCR resolution",
      "template_steps": [
        {
          "id": 1,
          "workflow_id": "WF-TMPL-NCR",
          "step_number": 1,
          "description": "Perform root cause analysis",
          "default_responsible": "Quality Department",
          "default_expected_duration": "2 days",
          "default_required_documents": "NCR Form, Inspection Report",
          "default_output": "Root cause report",
          "is_mandatory": true,
          "default_escalation_contact": "Quality Supervisor"
        },
        {
          "id": 2,
          "workflow_id": "WF-TMPL-NCR",
          "step_number": 2,
          "description": "Implement corrective action",
          "default_responsible": "Production Team",
          "default_expected_duration": "3 days",
          "default_required_documents": "CAR Form",
          "default_output": "Corrective action implemented",
          "is_mandatory": true,
          "default_escalation_contact": "Production Manager"
        }
      ]
    },
    {
      "id": "WF-2025-001",
      "title": "NCR-2025-001 Resolution",
      "description": "Handling NCR for weld crack issue",
      "is_template": false,
      "parent_workflow_id": "WF-TMPL-NCR",
      "version": "1.0",
      "created_at": "2025-04-18T08:00:00Z",
      "updated_at": "2025-04-18T09:00:00Z",
      "created_by": "Quality Officer",
      "status": "Active",
      "is_approved": true,
      "approved_by": "Quality Manager",
      "approval_date": "2025-04-18T08:30:00Z",
      "related_process": "Quality Control",
      "priority": "High",
      "notes": "Specific to NCR-2025-001",
      "steps": [
        {
          "id": 1,
          "workflow_id": "WF-2025-001",
          "template_step_id": 1,
          "step_number": 1,
          "description": "Perform root cause analysis",
          "responsible": "John Doe",
          "expected_duration": "2 days",
          "required_documents": "NCR Form, Weld Inspection Report",
          "output": "Root cause report",
          "status": "Completed",
          "created_at": "2025-04-18T08:00:00Z",
          "updated_at": "2025-04-18T10:00:00Z",
          "completed_at": "2025-04-18T10:00:00Z",
          "completed_by": "John Doe",
          "comments": "Identified incorrect machine settings",
          "is_mandatory": true,
          "escalation_contact": "Quality Supervisor",
          "is_additional": false
        },
        {
          "id": 2,
          "workflow_id": "WF-2025-001",
          "template_step_id": 2,
          "step_number": 2,
          "description": "Implement corrective action",
          "responsible": "Jane Smith",
          "expected_duration": "3 days",
          "required_documents": "CAR Form, Calibration Record",
          "output": "Corrective action implemented",
          "status": "In Progress",
          "created_at": "2025-04-18T08:00:00Z",
          "updated_at": "2025-04-18T11:00:00Z",
          "completed_at": null,
          "completed_by": null,
          "comments": "Calibration in progress",
          "is_mandatory": true,
          "escalation_contact": "Production Manager",
          "is_additional": false
        },
        {
          "id": 3,
          "workflow_id": "WF-2025-001",
          "template_step_id": null,
          "step_number": 3,
          "description": "Train operators",
          "responsible": "Training Coordinator",
          "expected_duration": "1 day",
          "required_documents": "Training Plan",
          "output": "Trained operators",
          "status": "Pending",
          "created_at": "2025-04-18T08:00:00Z",
          "updated_at": null,
          "completed_at": null,
          "completed_by": null,
          "comments": "Added step for operator training",
          "is_mandatory": false,
          "escalation_contact": "HR Manager",
          "is_additional": true
        }
      ]
    },
    {
      "id": "WF-2025-002",
      "title": "Customer Complaint Resolution",
      "description": "Ad-hoc process for resolving complaint CC-2025-009",
      "is_template": false,
      "parent_workflow_id": null,
      "version": "1.0",
      "created_at": "2025-04-18T09:00:00Z",
      "updated_at": null,
      "created_by": "Customer Service Manager",
      "status": "Active",
      "is_approved": false,
      "approved_by": null,
      "approval_date": null,
      "related_process": "Customer Satisfaction",
      "priority": "High",
      "notes": "Unique workflow for specific complaint",
      "steps": [
        {
          "id": 4,
          "workflow_id": "WF-2025-002",
          "template_step_id": null,
          "step_number": 1,
          "description": "Investigate complaint details",
          "responsible": "Quality Team",
          "expected_duration": "2 days",
          "required_documents": "Complaint Form, Product Specs",
          "output": "Investigation report",
          "status": "In Progress",
          "created_at": "2025-04-18T09:00:00Z",
          "updated_at": "2025-04-18T10:00:00Z",
          "completed_at": null,
          "completed_by": null,
          "comments": "Initial investigation started",
          "is_mandatory": true,
          "escalation_contact": "Quality Manager",
          "is_additional": false
        },
        {
          "id": 5,
          "workflow_id": "WF-2025-002",
          "template_step_id": null,
          "step_number": 2,
          "description": "Propose solution to customer",
          "responsible": "Sales Team",
          "expected_duration": "1 day",
          "required_documents": "Solution Proposal",
          "output": "Customer approval",
          "status": "Pending",
          "created_at": "2025-04-18T09:00:00Z",
          "updated_at": null,
          "completed_at": null,
          "completed_by": null,
          "comments": null,
          "is_mandatory": true,
          "escalation_contact": "Sales Manager",
          "is_additional": false
        }
      ]
    }
  ]
}
    '''