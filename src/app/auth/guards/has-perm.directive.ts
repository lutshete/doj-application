import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from './../permission.service';
import { PermOrAlias } from './../permissions';

@Directive({ selector: '[appHasPerm]' })
export class HasPermDirective {
  private required: PermOrAlias | null = null;

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private perms: PermissionService
  ) {}

  @Input() set appHasPerm(perm: PermOrAlias | null) {
    this.required = perm;
    this.update();
  }

  private update() {
    this.vcr.clear();
    if (this.required && this.perms.can(this.required)) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
