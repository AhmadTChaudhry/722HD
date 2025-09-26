terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Define variables that will be passed in from the CI/CD pipeline
variable "resource_group_name" {
  type        = string
  description = "The name of the Azure Resource Group."
}

variable "acr_name" {
  type        = string
  description = "The name of the Azure Container Registry."
}

variable "cluster_name" {
  type        = string
  description = "The name of the Azure Kubernetes Service cluster."
}

# Use the variables to define the resources
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name # Was hardcoded, now uses a variable
  location = "Australia East"
}

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name # Was hardcoded, now uses a variable
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Standard"
  admin_enabled       = true
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.cluster_name # Was hardcoded, now uses a variable
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = var.cluster_name # Was hardcoded, now uses a variable

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_D2s_v3"
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}