# crud/workflow.py
from sqlalchemy.orm import Session, joinedload
from models.workflow import Workflow, WorkflowStep, WorkflowStepTemplate
from models.user import User, RoleEnum
import schemas.workflow as workflow_schemas
from datetime import datetime

def create_workflow(db: Session, workflow: workflow_schemas.WorkflowCreate, creator_id: int):
    """
    Create a standard workflow.
    """
    db_workflow = Workflow(
        **workflow.dict(exclude={'viewer_ids', 'responsible_user_ids'}),
        creator_id=creator_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    if workflow.viewer_ids:
        viewers = db.query(User).filter(User.id.in_(workflow.viewer_ids)).all()
        db_workflow.viewers = viewers
    if workflow.responsible_user_ids:
        responsible_users = db.query(User).filter(User.id.in_(workflow.responsible_user_ids)).all()
        db_workflow.responsible_users = responsible_users
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

def create_workflow_from_template(db: Session, workflow: workflow_schemas.WorkflowCreateFromTemplate, creator_id: int):
    """
    Create a workflow from a template, copying steps with overrides.
    """
    template_workflow = db.query(Workflow).filter(
        Workflow.id == workflow.template_workflow_id,
        Workflow.is_template == True
    ).first()
    if not template_workflow:
        return None
    
    db_workflow = Workflow(
        title=workflow.title,
        status=workflow.status,
        approver_id=workflow.approver_id,
        is_template=False,
        parent_workflow_id=workflow.parent_workflow_id,
        uploaded_files=workflow.uploaded_files,
        creator_id=creator_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    if workflow.viewer_ids:
        viewers = db.query(User).filter(User.id.in_(workflow.viewer_ids)).all()
        db_workflow.viewers = viewers
    if workflow.responsible_user_ids:
        responsible_users = db.query(User).filter(User.id.in_(workflow.responsible_user_ids)).all()
        db_workflow.responsible_users = responsible_users
    
    db.add(db_workflow)
    db.commit()
    
    # Copy template steps
    template_steps = db.query(WorkflowStepTemplate).filter(
        WorkflowStepTemplate.workflow_id == workflow.template_workflow_id
    ).order_by(WorkflowStepTemplate.step_number).all()
    
    step_overrides = {override.get('step_number'): override for override in workflow.step_overrides or []}
    
    for template_step in template_steps:
        override = step_overrides.get(template_step.step_number, {})
        db_step = WorkflowStep(
            workflow_id=db_workflow.id,
            step_number=template_step.step_number,
            description=template_step.description,
            is_mandatory=template_step.is_mandatory,
            template_step_id=template_step.id,
            expected_duration=override.get('expected_duration', template_step.default_expected_duration),
            required_documents=override.get('required_documents', template_step.default_required_documents),
            output=override.get('output', template_step.default_output),
            escalation_contact_id=override.get('escalation_contact_id'),
            status="Pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        if workflow.responsible_user_ids:
            db_step.responsible_users = db_workflow.responsible_users
        db.add(db_step)
    
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

def get_workflow(db: Session, workflow_id: int):
    return (
        db.query(Workflow)
        .options(
            joinedload(Workflow.steps).joinedload(WorkflowStep.responsible_users),
            joinedload(Workflow.template_steps),
            joinedload(Workflow.viewers),
            joinedload(Workflow.responsible_users),
            joinedload(Workflow.creator),
            joinedload(Workflow.approver)
        )
        .filter(Workflow.id == workflow_id)
        .first()
    )

def get_workflows(db: Session, skip: int = 0, limit: int = 100, creator_id: int = None):
    query = db.query(Workflow).options(
        joinedload(Workflow.steps),
        joinedload(Workflow.template_steps),
        joinedload(Workflow.viewers),
        joinedload(Workflow.responsible_users)
    )
    if creator_id:
        query = query.filter(Workflow.creator_id == creator_id)
    return query.offset(skip).limit(limit).all()

def update_workflow(db: Session, workflow_id: int, workflow: workflow_schemas.WorkflowUpdate):
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not db_workflow:
        return None
    update_data = workflow.dict(exclude_unset=True, exclude={'viewer_ids', 'responsible_user_ids'})
    for key, value in update_data.items():
        setattr(db_workflow, key, value)
    if workflow.viewer_ids is not None:
        viewers = db.query(User).filter(User.id.in_(workflow.viewer_ids)).all()
        db_workflow.viewers = viewers
    if workflow.responsible_user_ids is not None:
        responsible_users = db.query(User).filter(User.id.in_(workflow.responsible_user_ids)).all()
        db_workflow.responsible_users = responsible_users
        for step in db_workflow.steps:
            step.responsible_users = responsible_users
    db_workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

def delete_workflow(db: Session, workflow_id: int):
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if db_workflow:
        db.delete(db_workflow)
        db.commit()

def create_workflow_step(db: Session, workflow_id: int, step: workflow_schemas.WorkflowStepCreate):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        return None
    db_step = WorkflowStep(
        **step.dict(exclude={'responsible_user_ids'}),
        workflow_id=workflow_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        is_additional=(step.template_step_id is None)
    )
    responsible_user_ids = step.responsible_user_ids or []
    if responsible_user_ids:
        responsible_users = db.query(User).filter(User.id.in_(responsible_user_ids)).all()
        db_step.responsible_users = responsible_users
    elif workflow.responsible_users:
        db_step.responsible_users = workflow.responsible_users
    
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    return db_step

def get_workflow_steps(db: Session, workflow_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(WorkflowStep)
        .filter(WorkflowStep.workflow_id == workflow_id)
        .options(joinedload(WorkflowStep.responsible_users))
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_workflow_step(db: Session, step_id: int):
    return (
        db.query(WorkflowStep)
        .options(joinedload(WorkflowStep.responsible_users), joinedload(WorkflowStep.workflow))
        .filter(WorkflowStep.id == step_id)
        .first()
    )

def update_workflow_step(db: Session, step_id: int, step: workflow_schemas.WorkflowStepUpdate):
    db_step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
    if not db_step:
        return None
    update_data = step.dict(exclude_unset=True, exclude={'responsible_user_ids'})
    for key, value in update_data.items():
        setattr(db_step, key, value)
    if step.responsible_user_ids is not None:
        responsible_users = db.query(User).filter(User.id.in_(step.responsible_user_ids)).all()
        db_step.responsible_users = responsible_users
    db_step.updated_at = datetime.utcnow()
    
    if db_step.status == "Completed" and db_step.template_step_id:
        template_step = db.query(WorkflowStepTemplate).filter(WorkflowStepTemplate.id == db_step.template_step_id).first()
        if template_step and template_step.next_step_on_success:
            next_template_step = db.query(WorkflowStepTemplate).filter(
                WorkflowStepTemplate.id == template_step.next_step_on_success
            ).first()
            if next_template_step:
                next_step = WorkflowStep(
                    workflow_id=db_step.workflow_id,
                    step_number=next_template_step.step_number,
                    description=next_template_step.description,
                    is_mandatory=next_template_step.is_mandatory,
                    template_step_id=next_template_step.id,
                    expected_duration=next_template_step.default_expected_duration,
                    required_documents=next_template_step.default_required_documents,
                    output=next_template_step.default_output,
                    status="Pending",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                if db_step.workflow.responsible_users:
                    next_step.responsible_users = db_step.workflow.responsible_users
                db.add(next_step)
    
    db.commit()
    db.refresh(db_step)
    return db_step

def delete_workflow_step(db: Session, step_id: int):
    db_step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
    if db_step:
        db.delete(db_step)
        db.commit()

def create_workflow_step_template(db: Session, workflow_id: int, step_template: workflow_schemas.WorkflowStepTemplateCreate):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow or not workflow.is_template:
        return None
    db_step_template = WorkflowStepTemplate(
        **step_template.dict(),
        workflow_id=workflow_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_step_template)
    db.commit()
    db.refresh(db_step_template)
    return db_step_template

def update_workflow_step_template(db: Session, step_template_id: int, step_template: workflow_schemas.WorkflowStepTemplateCreate):
    db_step_template = db.query(WorkflowStepTemplate).filter(WorkflowStepTemplate.id == step_template_id).first()
    if not db_step_template:
        return None
    update_data = step_template.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_step_template, key, value)
    db_step_template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_step_template)
    return db_step_template

def delete_workflow_step_template(db: Session, step_template_id: int):
    db_step_template = db.query(WorkflowStepTemplate).filter(WorkflowStepTemplate.id == step_template_id).first()
    if db_step_template:
        db.delete(db_step_template)
        db.commit()