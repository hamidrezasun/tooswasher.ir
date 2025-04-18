# models/workflow.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from typing import List

# Association tables
workflow_viewers = Table(
    'workflow_viewers',
    Base.metadata,
    Column('workflow_id', Integer, ForeignKey('workflows.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

workflow_responsible_users = Table(
    'workflow_responsible_users',
    Base.metadata,
    Column('workflow_id', Integer, ForeignKey('workflows.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

workflow_step_responsible_users = Table(
    'workflow_step_responsible_users',
    Base.metadata,
    Column('workflow_step_id', Integer, ForeignKey('workflow_steps.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    approver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    status = Column(String(50), default="Draft", index=True)
    is_template = Column(Boolean, default=False)
    parent_workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="SET NULL"), index=True)
    uploaded_files = Column(JSON, default=list)  # Removed server_default='[]'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[creator_id], backref="created_workflows")
    approver = relationship("User", foreign_keys=[approver_id], backref="approved_workflows")
    viewers = relationship("User", secondary=workflow_viewers, backref="viewable_workflows")
    responsible_users = relationship("User", secondary=workflow_responsible_users, backref="responsible_workflows")
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")
    template_steps = relationship("WorkflowStepTemplate", back_populates="workflow", cascade="all, delete-orphan")
    parent = relationship("Workflow", remote_side=[id], backref="children")

    @property
    def uploaded_files_list(self) -> List[str]:
        return self.uploaded_files or []

    @uploaded_files_list.setter
    def uploaded_files_list(self, value: List[str]) -> None:
        if not isinstance(value, list):
            raise ValueError("Uploaded files must be a list")
        self.uploaded_files = value

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False, index=True)
    description = Column(String(1000), nullable=False)
    status = Column(String(50), default="Pending", index=True)
    is_mandatory = Column(Boolean, default=False)
    is_additional = Column(Boolean, default=False)
    template_step_id = Column(Integer, ForeignKey("workflow_step_templates.id", ondelete="SET NULL"), index=True)
    expected_duration = Column(Integer)
    required_documents = Column(String(500))
    output = Column(String(500))
    escalation_contact_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    uploaded_files = Column(JSON, default=list)  # Removed server_default='[]'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(String(100))

    # Relationships
    workflow = relationship("Workflow", back_populates="steps")
    template_step = relationship("WorkflowStepTemplate", backref="workflow_steps")
    escalation_contact = relationship("User", foreign_keys=[escalation_contact_id], backref="escalated_steps")
    responsible_users = relationship("User", secondary=workflow_step_responsible_users, backref="responsible_steps")

    @property
    def uploaded_files_list(self) -> List[str]:
        return self.uploaded_files or []

    @uploaded_files_list.setter
    def uploaded_files_list(self, value: List[str]) -> None:
        if not isinstance(value, list):
            raise ValueError("Uploaded files must be a list")
        self.uploaded_files = value

class WorkflowStepTemplate(Base):
    __tablename__ = "workflow_step_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False, index=True)
    description = Column(String(1000), nullable=False)
    is_mandatory = Column(Boolean, default=False)
    default_expected_duration = Column(Integer)
    default_required_documents = Column(String(500))
    default_output = Column(String(500))
    next_step_on_success = Column(Integer, ForeignKey("workflow_step_templates.id", ondelete="SET NULL"), index=True)
    next_step_on_failure = Column(Integer, ForeignKey("workflow_step_templates.id", ondelete="SET NULL"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    workflow = relationship("Workflow", back_populates="template_steps")
    next_step_on_success_relation = relationship(
        "WorkflowStepTemplate",
        foreign_keys=[next_step_on_success],
        backref="previous_step_on_success",
        remote_side=[id],
        uselist=False
    )
    next_step_on_failure_relation = relationship(
        "WorkflowStepTemplate",
        foreign_keys=[next_step_on_failure],
        backref="previous_step_on_failure",
        remote_side=[id],
        uselist=False
    )