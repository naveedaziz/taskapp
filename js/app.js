(function(){
	'use strict';
	angular.module('myApp', ['onsen.directives'])
	.directive('appFilereader', function(
    $q
){
    var slice = Array.prototype.slice;

    return {
        restrict: 'A'
        , require: '?ngModel'
        , link: function(scope, element, attrs, ngModel){
            if(!ngModel) return;

            ngModel.$render = function(){}

            element.bind('change', function(e){
                var element = e.target;

                $q.all(slice.call(element.files, 0).map(readFile))
                .then(function(values){
                    if(element.multiple) ngModel.$setViewValue(values);
                    else ngModel.$setViewValue(values.length ? values[0] : null);
                });

                function readFile(file) {
                    var deferred = $q.defer();

                    var reader = new FileReader()
                    reader.onload = function(e){
                        deferred.resolve(e.target.result);
                    }
                    reader.onerror = function(e) {
                        deferred.reject(e);
                    }
                    reader.readAsDataURL(file);

                    return deferred.promise;
                }

            });//change

        }//link

    };//return

})//appFilereader
;
})();
function updateDateInputs() { 
	var formated = $('#datepickers').val();
	formated =  formated.split('-');
	if(formated[1]){
  	$('#selectedDate').val(formated[1]+'-'+formated[2]+'-'+formated[0]);
	}else{
	$('#selectedDate').val('');
	}
}
function MainCtrl($scope,$http,$rootScope){
	$rootScope.UserInfo = false;
	$rootScope.JobID = false;
	$rootScope.logout = function (ids){
		console.log('Done');
		localStorage.setItem('UserLogout',localStorage.getItem('User'));
		localStorage.removeItem('User');
		//localStorage.removeItem('JobPending');
		//localStorage.removeItem('JobDone');
		$rootScope.UserInfo = false;
		$rootScope.$apply();
		if(ids == 1){
			if(navigator.app){
					navigator.app.exitApp();
			}else if(navigator.device){
					navigator.device.exitApp();
			}
			return true;
		}
		ons.splitView.toggle();
		ons.splitView.setMainPage('page1.html');
	}
	$rootScope.syncstatus = 'Sync';
	
	$rootScope.currentDate = function(){
		var now = new Date();
		var month = (now.getMonth() + 1);               
		var day = now.getDate();
		if(month < 10) 
			month = "0" + month;
		if(day < 10) 
			day = "0" + day;
		var today =  month + '-' + day + '-'+now.getFullYear();
		return today;
	}
	$rootScope.syncData = function(){
		$rootScope.syncstatus = 'Syncing...';
		var StartIndex = 0;		
		$scope.employeeID  = JSON.parse(localStorage.getItem('User'));
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!
	
		var yyyy = today.getFullYear();
		if(dd<10){
			dd='0'+dd
		} 
		if(mm<10){
			mm='0'+mm
		} 
		var today = mm+'/'+dd+'/'+yyyy;
		
		////console.log(today);
		$scope.DataToSync = JSON.parse(localStorage.getItem('JobPending'));
		if($scope.DataToSync.length){
		
			$.each($scope.DataToSync,function(index,item){
				if(localStorage.getItem('SyncList_'+item.id)){
					StartIndex = item.id;
				}
			});
		//console.log(StartIndex + '------------------');
		var fds = {};
		var xhrs = {};
		$.each($scope.DataToSync,function(index,item){
			fds[index] = new FormData();
			if(localStorage.getItem('SyncList_'+item.id)){
				var JobDetails = JSON.parse(localStorage.getItem('SyncList_'+item.id));
				$.each(JobDetails,function(ind,itm){
					if(item.id && itm.id){
						////console.log($scope.employeeID.id+'------------'+item.id+'-----'+itm.id);
						if(itm.type == 'FileUpload'){
							
							fds[index].append("task_"+itm.id, localStorage.getItem(ind+'_'+item.id));
						}else if(itm.value){
							fds[index].append("task_"+itm.id, itm.value);	
						}else{
							fds[index].append("task_"+itm.id, '');	
						}
						////console.log(fds[index])	;			
						//
					}
				});
				
				
											
											fds[index].append("job_id", item.id);
											fds[index].append("employee_id", $scope.employeeID.id);
											fds[index].append("customer_id", item.customer_id);
											if(item.date){
												fds[index].append("date", item.date);
											}else{
												fds[index].append("date", today);
											}
											
											
											
											localStorage.removeItem('SyncList_'+item.id)
											////console.log(fds[index]);
											xhrs[index] = new XMLHttpRequest()
											xhrs[index].open("POST", "http://taskapp.net/manager/api/jobs.php");
											xhrs[index].onreadystatechange = function() {
													if (xhrs[index].readyState == 4) {
														var responced = JSON.parse(xhrs[index].response);
														////console.log(responced.status);
														if(responced.status == 'true'){
															if(item.id == StartIndex){
																$rootScope.NestDataSync();
															}
														}
													}
													$scope.$apply();
											}
											xhrs[index].send(fds[index]);
			}else{
				if(StartIndex == 0){
					$rootScope.NestDataSync();
				}
			}
		});
		}else{
			$rootScope.NestDataSync();
		}
		return true;
		
		
	}
	$rootScope.NestDataSync = function(){
		$rootScope.syncstatus = 'Syncing...';
		var StartIndex = 0;		
		$scope.employeeID  = JSON.parse(localStorage.getItem('User'));
		localStorage.removeItem('JobPending');
		localStorage.removeItem('JobDone');
		var fd = new FormData()
				fd.append("employee_id", 5);
				var xhr = new XMLHttpRequest()
				xhr.open("GET", "http://taskapp.net/manager/api/jobs.php?employee_id="+$scope.employeeID.id);
				xhr.onreadystatechange = function() {
						if (xhr.readyState == 4) {
							var responced = JSON.parse(xhr.response);
							if(!responced.status){
								//////console.log(responced);
								if(responced.length){
								var JobListing = responced;
								localStorage.setItem('JobPending',JSON.stringify(JobListing));
								var fds = {};
								var xhrs = {};
								var JobsIDS = {};
								$.each(JobListing,function(index,item){
									StartIndex = index;
								});
								$.each(JobListing,function(index,item){
									////console.log(item);
										fds[index] = new FormData()
										fds[index].append("employee_id", 5);
										xhrs[index] = new XMLHttpRequest();
										JobsIDS[index] = item.id;
										//if($rootScope.listCall == 0){
										xhrs[index].open("GET", "http://taskapp.net/manager/api/jobs.php?job_id="+item.id);
										//}else{
											//xhr.open("GET", "http://taskapp.net/manager/api/jobs-accomplished.php?view_id="+$rootScope.JobID);
										//}
										xhrs[index].onreadystatechange = function() {
												if (xhrs[index].readyState == 4) {
													var responced = JSON.parse(xhrs[index].response);
													if(!responced.status){
														////console.log(JobsIDS[index]);
														var JobDetailListing = responced;
														localStorage.setItem('JobPending_'+JobsIDS[index],JSON.stringify(JobDetailListing));
														if(index == StartIndex){
															$scope.SynNextData();
														}
														// ons.splitView.setMainPage('home.html');
													}else{
														//$scope.Invalid = true;
													}
												}
												$scope.$apply();
										}
										xhrs[index].send(fds[index]);
								});
								}else{
									$scope.SynNextData();
								}
								$scope.$apply();
								// ons.splitView.setMainPage('home.html');
							}else{
								$scope.SynNextData();
								//$scope.Invalid = true;
							}
						}
				}
				xhr.send(fd);
		return true;
	}
	$rootScope.SynNextData = function(){
		var StartIndex = 0;
		
		$scope.employeeID  = JSON.parse(localStorage.getItem('User'));
		
		
		var fd = new FormData()
				fd.append("employee_id", 5);
				var xhr = new XMLHttpRequest()
				xhr.open("GET", "http://taskapp.net/manager/api/jobs-accomplished.php?employee_id="+$scope.employeeID.id);
				xhr.onreadystatechange = function() {
						if (xhr.readyState == 4) {
							var responced = JSON.parse(xhr.response);
							if(!responced.status){
								//////console.log(responced);
								if(responced.length){
								var JobListing = responced;
								localStorage.setItem('JobDone',JSON.stringify(JobListing));
								var fds = {};
								var xhrs = {};
								var JobsIDS = {};
								$.each(JobListing,function(index,item){
									StartIndex = index;
								});
								$.each(JobListing,function(index,item){
									////console.log(item);
										fds[index] = new FormData()
										fds[index].append("employee_id", 5);
										xhrs[index] = new XMLHttpRequest();
										JobsIDS[index] = item.id;
										//if($rootScope.listCall == 0){
											xhrs[index].open("GET", "http://taskapp.net/manager/api/jobs-accomplished.php?view_id="+item.id);
										//}else{
											//xhr.open("GET", "http://taskapp.net/manager/api/jobs-accomplished.php?view_id="+$rootScope.JobID);
										//}
										xhrs[index].onreadystatechange = function() {
												if (xhrs[index].readyState == 4) {
													var responced = JSON.parse(xhrs[index].response);
													if(!responced.status){
														////console.log(JobsIDS[index]);
														var JobDetailListing = responced;
														localStorage.setItem('JobDone_'+JobsIDS[index],JSON.stringify(JobDetailListing));
														if(index == StartIndex){
															//$scope.SynNextData();
															$rootScope.syncstatus = 'Sync Done';
															$rootScope.$apply();
															setTimeout(function(){
																$rootScope.syncstatus = 'Sync';
																$rootScope.$apply();
															},2000);
														}
														// ons.splitView.setMainPage('home.html');
													}else{
														//$scope.Invalid = true;
													}
												}
												$scope.$apply();
										}
										xhrs[index].send(fds[index]);
								});
								$scope.$apply();
								}else{
									$rootScope.syncstatus = 'Sync Done';
															$rootScope.$apply();
															setTimeout(function(){
																$rootScope.syncstatus = 'Sync';
																$rootScope.$apply();
															},2000);
								}
								// ons.splitView.setMainPage('home.html');
							}else{
								$rootScope.syncstatus = 'Sync Done';
															$rootScope.$apply();
															setTimeout(function(){
																$rootScope.syncstatus = 'Sync';
																$rootScope.$apply();
															},2000);
							}
						}
				}
				xhr.send(fd);
		return true;
		
	}
}
function LoginCtrl($scope,$http,$rootScope){
	
	$scope.Invalid= false;
	$scope.inprocess = false;
	$scope.init = function(){
		if(localStorage.getItem('User')){
			$rootScope.UserInfo = JSON.parse(localStorage.getItem('User'));
			console.log($rootScope.UserInfo);
			$rootScope.$apply();
			 //ons.splitView.toggle();
			 ons.splitView.setMainPage('home.html');
		}
	}
	$scope.loginUser = function(){
		$scope.inprocess = true;
		$scope.Invalid= false;
		if(!localStorage.getItem('User')){
			var fd = new FormData();
			fd.append("employee_login", $scope.userName);
			fd.append("employee_pass", $scope.userPassword);
			var xhr = new XMLHttpRequest()
			xhr.open("POST", "http://taskapp.net/manager/api/login.php");
			xhr.onreadystatechange = function() {
				console.log(xhr.readyState);				
					if (xhr.readyState == 4) {
						$scope.inprocess = false;
						if(xhr.response){
							var responced = JSON.parse(xhr.response);
							localStorage.removeItem('JobPending');
							localStorage.removeItem('JobDone');
							
							$scope.inprocess = false;
							if(!responced.status){
								////console.log(responced);
								$rootScope.UserInfo = responced;
								localStorage.setItem('User',JSON.stringify($rootScope.UserInfo));
								ons.splitView.setMainPage('home.html');
							}else{
								$scope.Invalid = true;
							}
						}else{
							var loginCheck  = JSON.parse(localStorage.getItem('UserLogout'));
							if($scope.userName == loginCheck.email && $scope.userPassword == loginCheck.password){
								$rootScope.UserInfo = loginCheck;
								localStorage.setItem('User',localStorage.getItem('UserLogout'));
								ons.splitView.setMainPage('home.html');
							}else{
								$scope.Invalid = true;
							}
						}
					}
					$scope.$apply();
			}
			xhr.send(fd);
		}else{
			$rootScope.UserInfo = JSON.parse(localStorage.getItem('User'));
		}
		
	}
}
function ListingScreen($scope,$http,$rootScope){
		
	$scope.JobListing = false;
	$scope.JobListingPending = false;
	$rootScope.listCall = 0;
	$scope.setJobID = function(id,call){
		$rootScope.JobID = id;
		$rootScope.listCall = call;
		$rootScope.$apply();
		ons.splitView.setMainPage('inside.html');
	}
	$scope.init = function(){
		//$scope.Invalid= false;
		if(!localStorage.getItem('JobPending')){
				var fd = new FormData()
				fd.append("employee_id", 5);
				var xhr = new XMLHttpRequest()
				xhr.open("GET", "http://taskapp.net/manager/api/jobs.php?employee_id="+$rootScope.UserInfo.id);
				xhr.onreadystatechange = function() {
						if (xhr.readyState == 4) {
							var responced = JSON.parse(xhr.response);
							if(!responced.status){
								////console.log(responced);
								$scope.JobListing = responced;
								localStorage.setItem('JobPending',JSON.stringify($scope.JobListing));
								$scope.$apply();
								// ons.splitView.setMainPage('home.html');
							}else{
								//$scope.Invalid = true;
							}
						}
				}
				xhr.send(fd);
		}else{
			$scope.JobListing = JSON.parse(localStorage.getItem('JobPending'));
			
		}
		if(!localStorage.getItem('JobDone')){		
				var xhr2 = new XMLHttpRequest()
				xhr2.open("GET", "http://taskapp.net/manager/api/jobs-accomplished.php?employee_id="+$rootScope.UserInfo.id);
				xhr2.onreadystatechange = function() {
						if (xhr2.readyState == 4) {
							var responced = JSON.parse(xhr2.response);
							if(!responced.status){
								////console.log(responced);
								$scope.JobListingPending = responced;
								localStorage.setItem('JobDone',JSON.stringify($scope.JobListingPending));
								$scope.$apply();
								// ons.splitView.setMainPage('home.html');
							}else{
								//$scope.Invalid = true;
							}
						}
						
				}
				xhr2.send(fd);
		}else{
			$scope.JobListingPending = JSON.parse(localStorage.getItem('JobDone'));
		}
		
		
	}
}

function ListingDetailScreen($scope,$http,$rootScope){
	$rootScope.JobDetailListing = false;
	$scope.bda = true;
	$scope.falseBDA = function(){
		$scope.bda = true;
	}
	$scope.init = function(){
		
		//$scope.Invalid= false;
		if($rootScope.listCall == 0){
		if(!localStorage.getItem('JobPending_'+$rootScope.JobID)){
			var fd = new FormData()
			fd.append("employee_id", 5);
			var xhr = new XMLHttpRequest()
			
				xhr.open("GET", "http://taskapp.net/manager/api/jobs.php?job_id="+$rootScope.JobID);
			
			xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						var responced = JSON.parse(xhr.response);
						if(!responced.status){
							////console.log(responced);
							var preData = responced;
							var proto = {};
							$.each(preData,function(index,item){
								if(item.category && !proto[item.category]){
									proto[item.category] = {};
								}
								if(item.category){			
									proto[item.category][index] = item;
								}else{
									if(proto[index] != item)
									proto[index] = item;
								}
							});
							////console.log('----------------asdsad---------------');
							////console.log(proto);
							$rootScope.JobDetailListing = proto;
							$scope.JobDetailListing.date = $rootScope.currentDate;
							localStorage.setItem('JobPending_'+$rootScope.JobID,JSON.stringify($rootScope.JobDetailListing));
							
							
							// ons.splitView.setMainPage('home.html');
						}else{
							//$scope.Invalid = true;
						}
					}
					$scope.$apply();
			}
			xhr.send(fd);
		}else{
			//console.log('=========bda=============');
			var preData = JSON.parse(localStorage.getItem('JobPending_'+$rootScope.JobID));
			//console.log(preData);
			$.each(preData,function(index,item){
				if(typeof(item) == 'object'){
						if(item.FileUpload && item.FileUpload){
							//console.log(index+'_'+$rootScope.JobID);
							if(localStorage.getItem(index+'_'+$rootScope.JobID)){
								//console.log(localStorage.getItem(index+'_'+$rootScope.JobID));
								preData[index].FileUpload = localStorage.getItem(index+'_'+$rootScope.JobID);
							}
						}
				}
				
			});
			//console.log(preData);
			var proto = {};
			$.each(preData,function(index,item){
				if(item.category && !proto[item.category]){
					proto[item.category] = {};
				}
				if(item.category){			
					proto[item.category][index] = item;
				}else{
					if(proto[index] != item){
						proto[index] = item;
					}
				}
				////console.log(index+'========'+item);
			});
			////console.log(proto);
			$rootScope.JobDetailListing = proto;
			////console.log($rootScope.JobDetailListing);
			$.each($rootScope.JobDetailListing,function(index,item){
				$rootScope.JobDetailListing[index].value = '';
			});
			$scope.JobDetailListing.date = $rootScope.currentDate;
			$rootScope.$apply();
		}
		}else{
			if(!localStorage.getItem('JobDone_'+$rootScope.JobID)){
				var fd = new FormData()
				fd.append("employee_id", 5);
				var xhr = new XMLHttpRequest()
				
					xhr.open("GET", "http://taskapp.net/manager/api/jobs-accomplished.php?view_id="+$rootScope.JobID);
				
				xhr.onreadystatechange = function() {
						if (xhr.readyState == 4) {
							var responced = JSON.parse(xhr.response);
							if(!responced.status){
								////console.log(responced);
								var preData = responced;
								var proto = {};
								$.each(preData,function(index,item){
									if(item.category && !proto[item.category]){
										proto[item.category] = {};
									}
									if(item.category){			
										proto[item.category][index] = item;
									}else{
										if(proto[index] != item)
										proto[index] = item;
									}
								});
								////console.log(proto);
								$rootScope.JobDetailListing = proto;
								$scope.JobDetailListing.date = $rootScope.currentDate;
								
									localStorage.setItem('JobDone_'+$rootScope.JobID,JSON.stringify($rootScope.JobDetailListing));
								
								
								// ons.splitView.setMainPage('home.html');
							}else{
								//$scope.Invalid = true;
							}
						}
						$scope.$apply();
				}
				xhr.send(fd);
			}else{
				////console.log('=========bda=============');
				var preData = JSON.parse(localStorage.getItem('JobDone_'+$rootScope.JobID));
				var proto = {};
				$.each(preData,function(index,item){
					if(item.category && !proto[item.category]){
						proto[item.category] = {};
					}
					if(item.category){			
						proto[item.category][index] = item;
					}else{
						if(proto[index] != item)
						proto[index] = item;
					}
				});
				////console.log(proto);
				$rootScope.JobDetailListing = proto;
				
				////console.log($rootScope.JobDetailListing);
				$.each($rootScope.JobDetailListing,function(index,item){
					$rootScope.JobDetailListing[index].value = '';
				});
				$scope.JobDetailListing.date = $rootScope.currentDate;
				$rootScope.$apply();
			}
			
		}
		
		
		
	}
	$scope.changeValue = function(main,ids){
		////console.log($rootScope.JobDetailListing[main][ids].value);
		if($rootScope.listCall != 1){
			if($rootScope.JobDetailListing[main][ids].value == 'Yes'){
				$rootScope.JobDetailListing[main][ids].value = 'No';
				$rootScope.$apply();
			}else{
				$rootScope.JobDetailListing[main][ids].value = 'Yes';
				$rootScope.$apply();
			}
		}
	}
	$scope.returnTyepOf = function(id){
		////console.log(id);
		if(typeof(id) == 'object' && id != null){
			return true;
		}else{
			return false;
		}
	}
	$scope.SaveInfo = function(){
		//console.log('==================started==================');
		var preData = $rootScope.JobDetailListing;
				var proto = {};
				$.each(preData,function(index,item){
					if(typeof(item) == 'object'){
							$.each(item,function(indexX,itemX){
								////console.log(itemX.type);
								if(itemX.type == 'FileUpload'){
									//console.log(itemX);
									if(itemX.FileUpload && itemX.FileUpload){
										localStorage.setItem(indexX+'_'+$rootScope.JobID,itemX.FileUpload);
										itemX.FileUpload = indexX+'_'+$rootScope.JobID;
										proto[indexX] = itemX;
									}
								}else{
									proto[indexX] = itemX;
								}
							});
					}else{						
							proto[index] = item;						
					}
					
				});
		$rootScope.JobDetailListing = proto;
		////console.log(JSON.stringify($rootScope.JobDetailListing))
		localStorage.setItem('JobPending_'+$rootScope.JobID,JSON.stringify($rootScope.JobDetailListing));
		localStorage.setItem('SyncList_'+$rootScope.JobID,JSON.stringify($rootScope.JobDetailListing));
		alert('Saved Successfully. Please remember to sync (when you have Internet Access) to update the system.')
		ons.splitView.setMainPage('home.html');
	}
}
