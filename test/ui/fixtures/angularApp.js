var module = angular.module("sample", []);
module.controller("MainCtrl", MainCtrl);

function MainCtrl($scope, $http) {
    $scope.loadData = function loadData() {
        $http.get("angularApp.js").success(function(data) {
            $scope.data = data;
        });
    };
}