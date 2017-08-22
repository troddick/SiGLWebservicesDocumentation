// ------------------------------------------------------------------------------
// --------- app.component ------------------------------------------------------
// ------------------------------------------------------------------------------
// copyright:   2017 WiM - USGS
// authors:  Tonia Roddick USGS Wisconsin Internet Mapping             
// purpose: app component main shell that holds nav, sidebar, and mainview

import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";

import { MainviewComponent } from "./mainview/mainview.component";
import { IconfigObj } from "./shared/interfaces/IConfigObj.interface";
import { ConfigService } from "./config.service";
import { Iurilist } from "./shared/interfaces/IUrilist.interface";
import { Iresource } from "./shared/interfaces/IResource.interface";
import { PathService } from "./shared/services/path.service";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	@ViewChild('acc') accordion;
	public title: string;
	public configSettings: IconfigObj;

	constructor(private _configService: ConfigService, private _route: ActivatedRoute, 
			private _router: Router, private _pathService: PathService) {
		this.configSettings = this._configService.getConfiguration().configuration;
	}
	ngOnInit(){
		this.title = this.configSettings.homepagetitle + " Documentation";
		this._pathService.getPath().subscribe((path:string) => {
			if (path !== "home"){
				if (this.accordion.activeIds[0] !== path)
					this.accordion.activeIds = [path];
			} else this.accordion.activeIds = [];
		});
		
	}
	
	public getName(resName: string) {
		return resName.replace(/ /g,'');
	}
	public getLink(url: Iurilist){
		return url.id.replace(/ /g,'');
	}
}
