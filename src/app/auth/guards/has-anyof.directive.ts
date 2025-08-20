import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from './../permission.service';
import { ROLES } from './../permissions';

@Directive({ selector: '[appHasAnyOf]' })
export class HasAnyOfDirective {
  private conf: Array<{ role?: ROLES | string; permission?: string; adminOfficialOrChief?: true }> = [];

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private perms: PermissionService
  ) {}

  @Input() set appHasAnyOf(value: Array<{ role?: string; permission?: string; adminOfficialOrChief?: true }>) {
    this.conf = value || [];
    this.update();
  }

  private update() {
    this.vcr.clear();
    const ok = this.conf.some(i =>
      (i.role   && this.perms.hasRole(i.role)) ||
      (i.permission && this.perms.can(i.permission as any)) ||
      (i.adminOfficialOrChief && this.perms.isAdminOfficialOrChief())
    );
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }
}
