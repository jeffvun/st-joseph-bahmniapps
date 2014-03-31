'use strict';

Bahmni.Clinical.EncounterTransactionToObsMapper = function () {

    this.map = function (encounterTransactions) {
        var allObs,
            validObservation = function (observation) {
                if (observation.voided) return false;
                if (observation.value && !isObservationAgroup(observation)) return true;
                return isObservationAgroup(observation) && observation.groupMembers.some(validObservation);
            },
            setProvider = function (provider) {
                var setProviderToObservation = function(observation) {
                    observation.provider = provider;
                    angular.forEach(observation.groupMembers, setProviderToObservation);
                };
                return setProviderToObservation;
            },
            setProviderToObservations = function(observations, provider){
                var setProviderFunction = setProvider(provider);
                angular.forEach(observations, function(observation) {
                    setProviderFunction(observation);
                });
            },
            removeAbnormalObs = function(observation){
                observation.groupMembers.forEach(function(obsMember, index){
                  if(Bahmni.Clinical.Constants.abnormalObservation.indexOf(obsMember.concept.name)>=0){ // if setMember is isAbnormal
                    observation.groupMembers[index-1].is_abnormal = obsMember.value; //assuming observation is stored at next level than isAbnormal
                    delete observation.groupMembers[index];
                    return;
                  }
                  else {
                       angular.forEach(obsMember.groupMembers, removeAbnormalObs);
                  }
                })
            },
            flatten = function (transactions, item) {
                return transactions.reduce(function (result, transaction) {
                    setProviderToObservations(transaction[item], transaction.providers[0]);
                    angular.forEach(transaction[item], removeAbnormalObs);
                    return result.concat(transaction[item]);
                }, []);
            },
            isObservationAgroup = function (observation) {
                return observation.groupMembers && observation.groupMembers.length > 0;
            },
            removeInvalidGroupMembers = function (observation) {
                angular.forEach(observation.groupMembers, removeInvalidGroupMembers);
                if (observation.groupMembers)
                    observation.groupMembers = observation.groupMembers.filter(validObservation);
            };

        allObs = flatten(encounterTransactions, 'observations').filter(validObservation);
        allObs.forEach(removeInvalidGroupMembers);
        return allObs;
    };
};