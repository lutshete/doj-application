import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[hasRole]' , standalone: true })
export class HasRoleDirective {
  private role?: string;
  constructor(private tpl: TemplateRef<any>, private vcr: ViewContainerRef) {}

  @Input() set hasRole(desired: string | string[]) {
    const me = JSON.parse(localStorage.getItem('me') || '{}');
    const myRole = me?.role;
    const ok = Array.isArray(desired) ? desired.includes(myRole) : desired === myRole;
    this.vcr.clear();
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }
}
