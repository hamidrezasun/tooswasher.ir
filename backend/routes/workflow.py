from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import crud.workflow as workflow_crud
import schemas.workflow as workflow_schemas
import schemas.user as user_schemas
import auth
from database import get_db
from models.workflow import Workflow, WorkflowStep, WorkflowStepTemplate
from models.user import User, RoleEnum

router = APIRouter(
    prefix="/workflows",
    tags=["workflows"]
)

def check_admin_or_participant(workflow: Workflow, user: user_schemas.User):
    if user.role == RoleEnum.admin:
        return
    step_responsible = any(user.id in [u.id for u in step.responsible_users] for step in workflow.steps)
    workflow_responsible = user.id in [u.id for u in workflow.responsible_users]
    if (user.role != RoleEnum.staff and 
        user.id != workflow.creator_id and 
        user.id != workflow.approver_id and 
        user not in workflow.viewers and 
        not step_responsible and 
        not workflow_responsible):
        raise HTTPException(status_code=403, detail="Not authorized for this workflow")

@router.post("/", response_model=workflow_schemas.WorkflowInDB)
def create_workflow(
    workflow: workflow_schemas.WorkflowCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(status_code=403, detail="Only admin or staff can create workflows")
    if workflow.responsible_user_ids and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can assign responsible users")
    existing_workflow = db.query(Workflow).filter(Workflow.title == workflow.title).first()
    if existing_workflow:
        raise HTTPException(status_code=400, detail="Workflow with this title already exists")
    return workflow_crud.create_workflow(db=db, workflow=workflow, creator_id=current_user.id)

@router.post("/from-template/", response_model=workflow_schemas.WorkflowInDB)
def create_workflow_from_template(
    workflow: workflow_schemas.WorkflowCreateFromTemplate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can create workflows from templates")
    created_workflow = workflow_crud.create_workflow_from_template(db=db, workflow=workflow, creator_id=current_user.id)
    if not created_workflow:
        raise HTTPException(status_code=404, detail="Template workflow not found")
    return created_workflow

@router.get("/", response_model=List[workflow_schemas.WorkflowInDB])
def read_workflows(
    skip: int = 0,
    limit: int = 100,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == RoleEnum.admin:
        return workflow_crud.get_workflows(db, skip=skip, limit=limit)
    workflows = (
        db.query(Workflow)
        .options(
            joinedload(Workflow.creator),
            joinedload(Workflow.approver),
            joinedload(Workflow.viewers),
            joinedload(Workflow.responsible_users),
            joinedload(Workflow.steps).joinedload(WorkflowStep.responsible_users),
            joinedload(Workflow.template_steps)
        )
        .filter(
            (Workflow.viewers.any(User.id == current_user.id)) |
            (Workflow.creator_id == current_user.id) |
            (Workflow.approver_id == current_user.id) |
            (Workflow.responsible_users.any(User.id == current_user.id)) |
            (Workflow.steps.any(WorkflowStep.responsible_users.any(User.id == current_user.id)))
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return workflows

@router.get("/{workflow_id}", response_model=workflow_schemas.WorkflowInDB)
def read_workflow(
    workflow_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    workflow = workflow_crud.get_workflow(db, workflow_id=workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    check_admin_or_participant(workflow, current_user)
    return workflow

@router.put("/{workflow_id}", response_model=workflow_schemas.WorkflowInDB)
def update_workflow(
    workflow_id: int,
    workflow: workflow_schemas.WorkflowUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if current_user.role != RoleEnum.admin:
        if current_user.role != RoleEnum.staff or db_workflow.creator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update workflow")
        if workflow.responsible_user_ids is not None:
            raise HTTPException(status_code=403, detail="Only admin can assign responsible users")
    if workflow.title and workflow.title != db_workflow.title:
        existing_workflow = db.query(Workflow).filter(
            Workflow.title == workflow.title,
            Workflow.id != workflow_id
        ).first()
        if existing_workflow:
            raise HTTPException(status_code=400, detail="Workflow with this title already exists")
    updated_workflow = workflow_crud.update_workflow(db, workflow_id=workflow_id, workflow=workflow)
    if not updated_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return updated_workflow

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if current_user.role != RoleEnum.admin:
        if current_user.role != RoleEnum.staff or db_workflow.creator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete workflow")
    if db_workflow.steps:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete workflow with existing steps"
        )
    workflow_crud.delete_workflow(db, workflow_id=workflow_id)
    return None

@router.post("/{workflow_id}/steps/", response_model=workflow_schemas.WorkflowStepInDB)
def create_workflow_step(
    workflow_id: int,
    step: workflow_schemas.WorkflowStepCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    is_workflow_responsible = current_user.id in [u.id for u in workflow.responsible_users]
    if current_user.role != RoleEnum.admin and not is_workflow_responsible:
        raise HTTPException(status_code=403, detail="Only admin or workflow responsible users can add steps")
    
    if workflow.is_template and step.template_step_id:
        template_step = db.query(WorkflowStepTemplate).filter(
            WorkflowStepTemplate.id == step.template_step_id,
            WorkflowStepTemplate.workflow_id == workflow_id
        ).first()
        if not template_step:
            raise HTTPException(status_code=400, detail="Invalid template step for this workflow")
    elif workflow.is_template and not step.template_step_id:
        raise HTTPException(status_code=400, detail="Templated workflows require a template step")
    
    if current_user.role != RoleEnum.admin and step.responsible_user_ids:
        raise HTTPException(status_code=403, detail="Only admin can assign responsible users to steps")
    
    return workflow_crud.create_workflow_step(db=db, workflow_id=workflow_id, step=step)

@router.get("/{workflow_id}/steps/", response_model=List[workflow_schemas.WorkflowStepInDB])
def read_workflow_steps(
    workflow_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    check_admin_or_participant(workflow, current_user)
    return workflow_crud.get_workflow_steps(db, workflow_id=workflow_id, skip=skip, limit=limit)

@router.get("/{workflow_id}/steps/{step_id}", response_model=workflow_schemas.WorkflowStepInDB)
def read_workflow_step(
    workflow_id: int,
    step_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    step = workflow_crud.get_workflow_step(db, step_id=step_id)
    if not step or step.workflow_id != workflow_id:
        raise HTTPException(status_code=404, detail="Step not found")
    check_admin_or_participant(step.workflow, current_user)
    return step

@router.put("/{workflow_id}/steps/{step_id}", response_model=workflow_schemas.WorkflowStepInDB)
def update_workflow_step(
    workflow_id: int,
    step_id: int,
    step: workflow_schemas.WorkflowStepUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
    if not db_step or db_step.workflow_id != workflow_id:
        raise HTTPException(status_code=404, detail="Step not found")
    if current_user.role != RoleEnum.admin:
        step_responsible = current_user.id in [u.id for u in db_step.responsible_users]
        workflow_responsible = current_user.id in [u.id for u in db_step.workflow.responsible_users]
        if not (step_responsible or workflow_responsible):
            raise HTTPException(status_code=403, detail="Not authorized to update step")
        if step.responsible_user_ids:
            raise HTTPException(status_code=403, detail="Only admin can assign responsible users")
    updated_step = workflow_crud.update_workflow_step(db, step_id=step_id, step=step)
    if not updated_step:
        raise HTTPException(status_code=404, detail="Step not found")
    return updated_step

@router.delete("/{workflow_id}/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow_step(
    workflow_id: int,
    step_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
    if not db_step or db_step.workflow_id != workflow_id:
        raise HTTPException(status_code=404, detail="Step not found")
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can delete steps")
    workflow_crud.delete_workflow_step(db, step_id=step_id)
    return None

@router.post("/{workflow_id}/template-steps/", response_model=workflow_schemas.WorkflowStepTemplateInDB)
def create_workflow_step_template(
    workflow_id: int,
    step_template: workflow_schemas.WorkflowStepTemplateCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if not workflow.is_template:
        raise HTTPException(status_code=400, detail="Workflow is not a template")
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can create template steps")
    return workflow_crud.create_workflow_step_template(db=db, workflow_id=workflow_id, step_template=step_template)

@router.get("/{workflow_id}/template-steps/", response_model=List[workflow_schemas.WorkflowStepTemplateInDB])
def read_workflow_step_templates(
    workflow_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    check_admin_or_participant(workflow, current_user)
    return workflow_crud.get_workflow_step_templates(db, workflow_id=workflow_id, skip=skip, limit=limit)

@router.get("/{workflow_id}/template-steps/{step_template_id}", response_model=workflow_schemas.WorkflowStepTemplateInDB)
def read_workflow_step_template(
    workflow_id: int,
    step_template_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    step_template = workflow_crud.get_workflow_step_template(db, step_template_id=step_template_id)
    if not step_template or step_template.workflow_id != workflow_id:
        raise HTTPException(status_code=404, detail="Step template not found")
    check_admin_or_participant(step_template.workflow, current_user)
    return step_template

@router.put("/{workflow_id}/template-steps/{step_template_id}", response_model=workflow_schemas.WorkflowStepTemplateInDB)
def update_workflow_step_template(
    workflow_id: int,
    step_template_id: int,
    step_template: workflow_schemas.WorkflowStepTemplateCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_step_template = db.query(WorkflowStepTemplate).filter(
        WorkflowStepTemplate.id == step_template_id,
        WorkflowStepTemplate.workflow_id == workflow_id
    ).first()
    if not db_step_template:
        raise HTTPException(status_code=404, detail="Step template not found")
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can update template steps")
    updated_step_template = workflow_crud.update_workflow_step_template(
        db, step_template_id=step_template_id, step_template=step_template
    )
    if not updated_step_template:
        raise HTTPException(status_code=404, detail="Step template not found")
    return updated_step_template

@router.delete("/{workflow_id}/template-steps/{step_template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow_step_template(
    workflow_id: int,
    step_template_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_step_template = db.query(WorkflowStepTemplate).filter(
        WorkflowStepTemplate.id == step_template_id,
        WorkflowStepTemplate.workflow_id == workflow_id
    ).first()
    if not db_step_template:
        raise HTTPException(status_code=404, detail="Step template not found")
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can delete template steps")
    workflow_crud.delete_workflow_step_template(db, step_template_id=step_template_id)
    return None